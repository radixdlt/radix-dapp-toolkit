import { ResultAsync, err, errAsync, ok, okAsync } from 'neverthrow'
import { Subscription } from 'rxjs'
import { EncryptionModule, transformBufferToSealbox } from '../../encryption'
import { Session, SessionModule } from '../../session/session.module'
import type {
  CallbackFns,
  WalletInteraction,
  WalletInteractionResponse,
} from '../../../../schemas'
import { Logger, isMobile, parseJSON } from '../../../../helpers'
import { SdkError } from '../../../../error'
import { DeepLinkModule } from './deep-link.module'
import { IdentityModule } from '../../identity/identity.module'
import { RequestItemModule } from '../../request-items/request-item.module'
import { StorageModule } from '../../../storage'
import { Curve25519 } from '../../crypto'
import {
  RadixConnectRelayApiService,
  WalletResponse,
} from './radix-connect-relay-api.service'
import type { TransportProvider } from '../../../../_types'
import { base64urlEncode } from './helpers/base64url'

export type RadixConnectRelayModule = ReturnType<typeof RadixConnectRelayModule>
export const RadixConnectRelayModule = (input: {
  baseUrl: string
  logger?: Logger
  walletUrl: string
  dAppDefinitionAddress: string
  providers: {
    requestItemModule: RequestItemModule
    storageModule: StorageModule
    encryptionModule?: EncryptionModule
    identityModule?: IdentityModule
    sessionModule?: SessionModule
    deepLinkModule?: DeepLinkModule
  }
}): TransportProvider => {
  const logger = input.logger?.getSubLogger({ name: 'RadixConnectRelayModule' })
  const { baseUrl, providers, walletUrl } = input
  const { requestItemModule, storageModule } = providers

  const walletResponses: StorageModule<WalletInteractionResponse> =
    storageModule.getPartition('walletResponses')

  const encryptionModule = providers?.encryptionModule ?? EncryptionModule()

  const deepLinkModule =
    providers?.deepLinkModule ??
    DeepLinkModule({
      logger,
      walletUrl,
    })

  const identityModule =
    providers?.identityModule ??
    IdentityModule({
      logger,
      dAppDefinitionAddress: input.dAppDefinitionAddress,
      providers: {
        storageModule: storageModule.getPartition('identities'),
        KeyPairModule: Curve25519,
      },
    })

  const sessionModule =
    providers?.sessionModule ??
    SessionModule({
      providers: {
        storageModule: storageModule.getPartition('sessions'),
      },
    })

  const radixConnectRelayApiService = RadixConnectRelayApiService({
    baseUrl: `${baseUrl}/api/v1`,
    logger,
  })

  const subscriptions = new Subscription()

  const wait = (timer = 1500) =>
    new Promise((resolve) => setTimeout(resolve, timer))

  const decryptWalletResponse = (
    walletResponse: WalletResponse,
  ): ResultAsync<WalletInteractionResponse, { reason: string }> => {
    if ('error' in walletResponse) {
      return errAsync({ reason: walletResponse.error })
    }

    return identityModule.get('dApp').andThen((dAppIdentity) =>
      dAppIdentity.x25519
        .calculateSharedSecret(
          walletResponse.publicKey,
          input.dAppDefinitionAddress,
        )
        .mapErr(() => ({ reason: 'FailedToDeriveSharedSecret' }))
        .asyncAndThen((sharedSecret) =>
          decryptWalletResponseData(sharedSecret, walletResponse.data),
        ),
    )
  }

  const checkRelayLoop = async () => {
    await requestItemModule.getPending().andThen((pendingItems) => {
      if (pendingItems.length === 0) {
        return okAsync(undefined)
      }

      return sessionModule
        .getCurrentSession()
        .andThen((session) =>
          radixConnectRelayApiService.getResponses(session.sessionId),
        )
        .andThen((responses) =>
          ResultAsync.combine(
            responses.map((response) => decryptWalletResponse(response)),
          ).andThen((decryptedResponses) => {
            return walletResponses.setItems(
              decryptedResponses.reduce(
                (acc, response) => {
                  acc[response.interactionId] = response
                  return acc
                },
                {} as Record<string, WalletInteractionResponse>,
              ),
            )
          }),
        )
    })
    await wait()
    checkRelayLoop()
  }

  if (isMobile()) {
    checkRelayLoop()
  }

  const sendWalletInteractionRequest = ({
    session,
    walletInteraction,
    signature,
    publicKey,
    identity,
  }: {
    session: Session
    walletInteraction: WalletInteraction
    signature: string
    publicKey: string
    identity: string
  }) =>
    requestItemModule
      .getById(walletInteraction.interactionId)
      .mapErr(() =>
        SdkError('FailedToGetPendingItems', walletInteraction.interactionId),
      )
      .andThen((pendingItem) =>
        pendingItem
          ? ok(pendingItem)
          : err(
              SdkError('PendingItemNotFound', walletInteraction.interactionId),
            ),
      )
      .andThen(() =>
        requestItemModule
          .patch(walletInteraction.interactionId, { sentToWallet: true })
          .andThen(() =>
            deepLinkModule.deepLinkToWallet({
              sessionId: session.sessionId,
              request: base64urlEncode(walletInteraction),
              signature,
              publicKey,
              identity: identity,
              origin: walletInteraction.metadata.origin,
              dAppDefinitionAddress:
                walletInteraction.metadata.dAppDefinitionAddress,
            }),
          ),
      )
      .mapErr(() =>
        SdkError('FailedToSendDappRequest', walletInteraction.interactionId),
      )

  const sendToWallet = (
    walletInteraction: WalletInteraction,
    callbackFns: Partial<CallbackFns>,
  ): ResultAsync<WalletInteractionResponse, SdkError> =>
    ResultAsync.combine([
      sessionModule
        .getCurrentSession()
        .mapErr((error) =>
          SdkError(error.reason, walletInteraction.interactionId),
        ),
      identityModule
        .get('dApp')
        .mapErr((error) =>
          SdkError(error.reason, walletInteraction.interactionId),
        ),
    ]).andThen(([session, dAppIdentity]) =>
      identityModule
        .createSignature({
          dAppDefinitionAddress:
            walletInteraction.metadata.dAppDefinitionAddress,
          interactionId: walletInteraction.interactionId,
          origin: walletInteraction.metadata.origin,
          kind: 'dApp',
        })
        .mapErr((error) =>
          SdkError(error.reason, walletInteraction.interactionId),
        )
        .andThen(({ signature }) =>
          sendWalletInteractionRequest({
            session,
            walletInteraction,
            signature,
            identity: dAppIdentity.ed25519.getPublicKey(),
            publicKey: dAppIdentity.x25519.getPublicKey(),
          }),
        )
        .andThen(() => waitForWalletResponse(walletInteraction.interactionId)),
    )

  const decryptWalletResponseData = (
    sharedSecretHex: string,
    value: string,
  ): ResultAsync<
    WalletInteractionResponse,
    { reason: string; jsError: Error }
  > =>
    transformBufferToSealbox(Buffer.from(value, 'hex'))
      .asyncAndThen(({ ciphertextAndAuthTag, iv }) =>
        encryptionModule.decrypt(
          ciphertextAndAuthTag,
          Buffer.from(sharedSecretHex, 'hex'),
          iv,
        ),
      )
      .andThen((decrypted) =>
        parseJSON<WalletInteractionResponse>(decrypted.toString('utf-8')),
      )
      .mapErr((error) => ({
        reason: 'FailedToDecryptWalletResponseData',
        jsError: error,
      }))

  const waitForWalletResponse = (
    interactionId: string,
  ): ResultAsync<WalletInteractionResponse, SdkError> =>
    ResultAsync.fromPromise(
      new Promise(async (resolve, reject) => {
        let response: WalletInteractionResponse | undefined
        let error: SdkError | undefined

        logger?.debug({
          method: 'waitForWalletResponse',
          interactionId,
        })

        while (!response) {
          const requestItemResult =
            await requestItemModule.getById(interactionId)

          if (requestItemResult.isOk()) {
            logger?.trace({
              method: 'waitForWalletResponse.requestItemResult',
              requestItemResult: requestItemResult.value,
            })
            if (requestItemResult.value?.status !== 'pending') {
              error = SdkError(
                'RequestItemNotPending',
                interactionId,
                'request not in pending state',
              )
              break
            }
          }

          const walletResponse =
            await walletResponses.getItemById(interactionId)

          if (walletResponse.isOk()) {
            if (walletResponse.value) {
              response = walletResponse.value
              await walletResponses.removeItemById(interactionId)
              await requestItemModule.patch(interactionId, {
                walletResponse: walletResponse.value,
              })
            }
          }

          if (!response) {
            await wait()
          }
        }

        return response ? resolve(response) : reject(error)
      }),
      (err) => err as SdkError,
    )

  return {
    id: 'radix-connect-relay' as const,
    isSupported: () => isMobile(),
    send: sendToWallet,
    disconnect: () => {},
    destroy: () => {
      subscriptions.unsubscribe()
    },
  } satisfies TransportProvider
}
