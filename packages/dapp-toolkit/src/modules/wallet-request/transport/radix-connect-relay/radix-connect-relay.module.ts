import { ResultAsync, err, errAsync, ok } from 'neverthrow'
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
        .andThen(() =>
          waitForWalletResponse({
            session,
            interactionId: walletInteraction.interactionId,
            dAppIdentity,
          }),
        ),
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

  const waitForWalletResponse = ({
    session,
    interactionId,
    dAppIdentity,
  }: {
    session: Session
    interactionId: string
    dAppIdentity: Curve25519
  }): ResultAsync<WalletInteractionResponse, SdkError> =>
    ResultAsync.fromPromise(
      new Promise(async (resolve, reject) => {
        let response: WalletInteractionResponse | undefined
        let error: SdkError | undefined
        let retry = 0

        const wait = (timer = 1500) =>
          new Promise((resolve) => setTimeout(resolve, timer))

        logger?.debug({
          method: 'waitForWalletResponse',
          sessionId: session.sessionId,
          interactionId,
        })

        const getEncryptedWalletResponses = () =>
          radixConnectRelayApiService.getResponses(session.sessionId)

        const decryptWalletResponse = (
          walletResponse: WalletResponse,
        ): ResultAsync<WalletInteractionResponse, { reason: string }> => {
          if ('error' in walletResponse) {
            return errAsync({ reason: walletResponse.error })
          }
          return dAppIdentity.x25519
            .calculateSharedSecret(
              walletResponse.publicKey,
              input.dAppDefinitionAddress,
            )
            .mapErr(() => ({ reason: 'FailedToDeriveSharedSecret' }))
            .asyncAndThen((sharedSecret) =>
              decryptWalletResponseData(sharedSecret, walletResponse.data),
            )
        }

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

          const encryptedWalletResponsesResult =
            await getEncryptedWalletResponses()

          if (encryptedWalletResponsesResult.isOk()) {
            const encryptedWalletResponses =
              encryptedWalletResponsesResult.value

            for (const encryptedWalletResponse of encryptedWalletResponses) {
              const walletResponseResult = await decryptWalletResponse(
                encryptedWalletResponse,
              )

              if (walletResponseResult.isErr())
                logger?.error({
                  method: 'waitForWalletResponse.decryptWalletResponse.error',
                  error: walletResponseResult.error,
                  sessionId: session.sessionId,
                  interactionId,
                })

              if (walletResponseResult.isOk()) {
                const walletResponse = walletResponseResult.value

                if (walletResponse.interactionId === interactionId) {
                  response = walletResponse
                  await requestItemModule.patch(walletResponse.interactionId, {
                    walletResponse,
                  })
                }
              }
            }
          }

          if (!response) {
            retry += 1
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
