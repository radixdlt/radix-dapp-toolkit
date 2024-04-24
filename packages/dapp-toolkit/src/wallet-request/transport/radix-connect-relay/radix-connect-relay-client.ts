import { Result, ResultAsync, errAsync, okAsync } from 'neverthrow'
import { fetchWrapper } from '../../../helpers/fetch-wrapper'
import {
  BehaviorSubject,
  Subscription,
  filter,
  firstValueFrom,
  merge,
  mergeMap,
  switchMap,
  tap,
  delay,
  of,
  Subject,
} from 'rxjs'
import { EncryptionClient, transformBufferToSealbox } from '../../encryption'
import {
  ActiveSession,
  PendingSession,
  Session,
  SessionClient,
} from '../../session/session'
import { Buffer } from 'buffer'
import type {
  CallbackFns,
  WalletInteraction,
  WalletInteractionResponse,
} from '../../../schemas'
import { Logger, isMobile, parseJSON } from '../../../helpers'
import { SdkError } from '../../../error'
import { DeepLinkClient } from './deep-link'
import { IdentityClient } from '../../identity/identity'
import { RequestItemClient } from '../../request-items/request-item-client'
import Bowser from 'bowser'
import { StorageProvider } from '../../../storage'
import { Curve25519 } from '../../crypto'
import { RequestItem } from 'radix-connect-common'

export type RadixConnectRelayClient = ReturnType<typeof RadixConnectRelayClient>
export const RadixConnectRelayClient = (input: {
  baseUrl: string
  logger?: Logger
  walletUrl: string
  providers: {
    requestItemClient: RequestItemClient
    storageClient: StorageProvider
    encryptionClient?: EncryptionClient
    identityClient?: IdentityClient
    sessionClient?: SessionClient
    deepLinkClient?: DeepLinkClient
  }
}) => {
  const logger = input.logger?.getSubLogger({ name: 'RadixConnectRelayClient' })
  const { baseUrl, providers, walletUrl } = input
  const { requestItemClient, storageClient } = providers

  const userAgent = Bowser.parse(window.navigator.userAgent)

  const encryptionClient = providers?.encryptionClient ?? EncryptionClient()

  const deepLinkClient =
    providers?.deepLinkClient ??
    DeepLinkClient({
      logger,
      origin,
      walletUrl,
      callBackPath: '#connect',
      userAgent,
    })

  const identityClient =
    providers?.identityClient ??
    IdentityClient({
      providers: {
        storageClient: storageClient.getPartition('identities'),
        KeyPairClient: Curve25519,
      },
    })

  const sessionClient =
    providers?.sessionClient ??
    SessionClient({
      providers: {
        storageClient: storageClient.getPartition('sessions'),
        identityClient,
      },
    })

  const apiV1Url = `${baseUrl}/api/v1`

  const sendHandshakeRequestToRadixConnectRelay = (
    sessionId: string,
    publicKeyHex: string,
  ): ResultAsync<void, SdkError> =>
    fetchWrapper(
      fetch(apiV1Url, {
        method: 'POST',
        body: JSON.stringify({
          method: 'sendHandshakeRequest',
          sessionId,
          data: publicKeyHex,
        }),
      }),
    )
      .map(() => {
        logger?.debug({
          method: 'sendHandshakeRequestToRadixConnectRelay.success',
        })
      })
      .mapErr(() => {
        logger?.debug({
          method: 'sendHandshakeRequestToRadixConnectRelay.error',
        })
        return SdkError('FailedToSendHandshakeRequestToRadixConnectRelay', '')
      })

  const getHandshakeResponseFromRadixConnectRelay = (sessionId: string) =>
    fetchWrapper<string>(
      fetch(apiV1Url, {
        method: 'POST',
        body: JSON.stringify({
          method: 'getHandshakeResponse',
          sessionId,
        }),
      }),
    )
      .map(({ data }) => {
        return parseJSON(
          // @ts-ignore
          Buffer.from(data.publicKey, 'hex').toString('utf-8'),
        )._unsafeUnwrap().publicKey
      })
      .mapErr(() =>
        SdkError('FailedToGetHandshakeResponseToRadixConnectRelay', ''),
      )

  const sendRequestToRadixConnectRelay = (
    sessionId: string,
    data: any,
  ): ResultAsync<void, SdkError> =>
    fetchWrapper(
      fetch(apiV1Url, {
        method: 'POST',
        body: JSON.stringify({
          method: 'sendRequest',
          sessionId,
          data,
        }),
      }),
    )
      .map(() => undefined)
      .mapErr(() => SdkError('FailedToSendRequestToRadixConnectRelay', ''))

  const getResponsesFromRadixConnectRelay = (
    sessionId: string,
  ): ResultAsync<
    {
      status: number
      data: unknown[]
    },
    SdkError
  > =>
    fetchWrapper<string[]>(
      fetch(apiV1Url, {
        method: 'POST',
        body: JSON.stringify({
          method: 'getResponses',
          sessionId: sessionId,
        }),
      }),
    ).mapErr(() => SdkError('FailedToGetRequestsFromRadixConnectRelay', ''))

  const decryptResponseFactory =
    (secret: Buffer) =>
    (
      value: string,
    ): ResultAsync<
      WalletInteractionResponse,
      { reason: string; shouldRetry: boolean }
    > =>
      transformBufferToSealbox(Buffer.from(value, 'hex'))
        .asyncAndThen(({ ciphertextAndAuthTag, iv }) =>
          encryptionClient.decrypt(ciphertextAndAuthTag, secret, iv),
        )
        .andThen((decrypted) =>
          parseJSON<WalletInteractionResponse>(decrypted.toString('utf-8')),
        )
        .mapErr(() => ({ reason: 'FailedToDecrypt', shouldRetry: true }))

  const subscriptions = new Subscription()

  const waitForWalletResponse = (
    interactionId: string,
  ): ResultAsync<RequestItem, SdkError> =>
    ResultAsync.fromPromise(
      firstValueFrom(
        merge(requestItemClient.store.storage$, of(null)).pipe(
          mergeMap(() =>
            requestItemClient.store
              .getItemById(interactionId)
              .mapErr(() => SdkError('FailedToGetRequestItem', interactionId)),
          ),
          filter((result): result is Result<RequestItem, SdkError> => {
            if (result.isErr()) return false
            return (
              result.value?.interactionId === interactionId &&
              ['success', 'fail'].includes(result.value.status)
            )
          }),
        ),
      ),
      () => SdkError('FailedToListenForWalletResponse', interactionId),
    ).andThen((result) => result)

  const encryptWalletInteraction = (
    walletInteraction: WalletInteraction,
    sharedSecret: Buffer,
  ): ResultAsync<string, SdkError> =>
    encryptionClient
      .encrypt(
        Buffer.from(JSON.stringify(walletInteraction), 'utf-8'),
        sharedSecret,
      )
      .mapErr(() =>
        SdkError(
          'FailEncryptWalletInteraction',
          walletInteraction.interactionId,
        ),
      )
      .map((sealedBoxProps) => sealedBoxProps.combined.toString('hex'))

  const handleLinkingRequest = (
    session: PendingSession,
    walletInteraction: WalletInteraction,
  ) => {
    const { sessionId } = session
    const url = new URL(origin)
    url.hash = 'connect'
    url.searchParams.set('sessionId', sessionId)
    const childWindow = window.open(url.toString())!

    return identityClient
      .get('dApp')
      .mapErr(() =>
        SdkError('FailedToGetDappIdentity', walletInteraction.interactionId),
      )
      .andThen((dAppIdentity) =>
        sendHandshakeRequestToRadixConnectRelay(
          sessionId,
          dAppIdentity.getPublicKey(),
        ),
      )
      .andThen(() =>
        sessionClient
          .patchSession(sessionId, { sentToWallet: true })
          .andThen(() =>
            deepLinkClient.deepLinkToWallet(
              {
                sessionId,
                origin,
              },
              childWindow,
            ),
          )
          .mapErr(() =>
            SdkError('FailedToUpdateSession', walletInteraction.interactionId),
          ),
      )
      .andThen(() =>
        waitForWalletResponse(walletInteraction.interactionId).map(
          (item) => item.walletResponse!,
        ),
      )
  }

  const sendEncryptedRequest = (
    activeSession: ActiveSession,
    walletInteraction: WalletInteraction,
  ) =>
    encryptWalletInteraction(
      walletInteraction,
      Buffer.from(activeSession.sharedSecret, 'hex'),
    ).andThen((encryptedWalletInteraction) =>
      sendRequestToRadixConnectRelay(
        activeSession.sessionId,
        encryptedWalletInteraction,
      ),
    )

  const send = (
    walletInteraction: WalletInteraction,
    callbackFns: Partial<CallbackFns>,
  ): ResultAsync<WalletInteractionResponse, SdkError> =>
    sessionClient
      .getCurrentSession()
      .mapErr(() =>
        SdkError('FailedToGetCurrentSession', walletInteraction.interactionId),
      )
      .andThen((session) => {
        return session.status === 'Pending'
          ? handleLinkingRequest(session, walletInteraction)
          : resume(walletInteraction.interactionId)
      })

  const handleWalletCallback = (values: Record<string, string>) => {
    const { sessionId, interactionId } = values
    if (sessionId) {
      return sessionClient.getSessionById(sessionId).andThen((session) => {
        if (session?.status === 'Pending' && session.sentToWallet) {
          return getHandshakeResponseFromRadixConnectRelay(session.sessionId)
            .andThen((walletPublicKey) =>
              walletPublicKey
                ? sessionClient.convertToActiveSession(
                    sessionId,
                    walletPublicKey,
                  )
                : errAsync(SdkError('WalletPublicKeyUnavailable', '')),
            )
            .map(() => {
              window.close()
            })
        } else if (session?.status === 'Active' && interactionId) {
          return requestItemClient.getPendingItems().map((pendingItems) => {
            const sendToWallet = pendingItems.filter(
              (item) => item.sentToWallet,
            )
            if (sendToWallet.length) {
              const decryptWalletInteraction = decryptResponseFactory(
                Buffer.from(session.sharedSecret, 'hex'),
              )
              getResponsesFromRadixConnectRelay(session.sessionId).map(
                (value) => {
                  for (const encryptedWalletInteraction of value.data) {
                    decryptWalletInteraction(
                      encryptedWalletInteraction as string,
                    ).map((decrypted) => {
                      requestItemClient
                        .patch(decrypted.interactionId, {
                          walletResponse: decrypted,
                        })
                        .map(() => {
                          window.close()
                        })
                    })
                  }
                },
              )
            }
          })
        }

        return errAsync(SdkError('SessionNotFound', sessionId))
      })
    }
  }

  subscriptions.add(
    deepLinkClient.walletResponse$
      .pipe(
        filter((values) => Object.values(values).length > 0),
        tap((item) => handleWalletCallback(item)),
      )
      .subscribe(),
  )

  deepLinkClient.handleWalletCallback()

  const resume = (interactionId: string) => {
    sessionClient.findActiveSession().andThen((session) => {
      if (session) {
        const url = new URL(origin)
        url.hash = 'connect'
        url.searchParams.set('sessionId', session.sessionId)
        url.searchParams.set('interactionId', interactionId)
        const childWindow = window.open(url.toString())!

        return requestItemClient.getPendingItems().andThen((pendingItems) => {
          const pendingItem = pendingItems.find(
            (item) => item.interactionId === interactionId,
          )
          if (pendingItem) {
            return requestItemClient
              .patch(interactionId, { sentToWallet: true })
              .andThen(() =>
                sendEncryptedRequest(session, pendingItem.walletInteraction),
              )
              .andThen(() =>
                deepLinkClient.deepLinkToWallet(
                  {
                    sessionId: session.sessionId,
                    interactionId: pendingItem.interactionId,
                  },
                  childWindow,
                ),
              )
          }
          return errAsync(SdkError('PendingItemNotFound', ''))
        })
      }
      return okAsync(undefined)
    })
    return waitForWalletResponse(interactionId).map(
      (item) => item.walletResponse!,
    )
  }

  return {
    isSupported: () => isMobile(),
    send,
    resume,
    disconnect: () => {},
    destroy: () => {
      subscriptions.unsubscribe()
    },
  }
}
