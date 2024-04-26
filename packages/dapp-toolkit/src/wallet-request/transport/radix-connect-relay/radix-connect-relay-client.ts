import { ResultAsync, err, errAsync, ok, okAsync } from 'neverthrow'
import { Subscription, filter, switchMap, tap } from 'rxjs'
import { EncryptionClient } from '../../encryption'
import {
  ActiveSession,
  PendingSession,
  SessionClient,
} from '../../session/session'
import type {
  CallbackFns,
  WalletInteraction,
  WalletInteractionResponse,
} from '../../../schemas'
import { Logger, isMobile } from '../../../helpers'
import { SdkError } from '../../../error'
import { DeepLinkClient } from './deep-link'
import { IdentityClient } from '../../identity/identity'
import { RequestItemClient } from '../../request-items/request-item-client'
import Bowser from 'bowser'
import { StorageProvider } from '../../../storage'
import { Curve25519 } from '../../crypto'
import { RadixConnectRelayApi } from './api'

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
      callBackPath: '/connect',
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

  const radixConnectRelayApi = RadixConnectRelayApi({
    baseUrl: `${baseUrl}/api/v1`,
    logger,
    providers: { encryptionClient },
  })

  const subscriptions = new Subscription()

  const handleLinkingRequest = (
    session: PendingSession,
    walletInteraction: WalletInteraction,
  ) => {
    const { sessionId } = session
    const url = new URL(`${origin}/connect`)
    url.searchParams.set('sessionId', sessionId)
    const childWindow = window.open(url.toString())!

    if (!childWindow) {
      logger?.debug({
        method: 'handleLinkingRequest.error',
        reason: 'FailedToChildOpenWindow',
      })
      return err(
        SdkError('FailedToChildOpenWindow', walletInteraction.interactionId),
      )
    }

    return identityClient
      .get('dApp')
      .andThen((dAppIdentity) =>
        ResultAsync.combine([
          sessionClient.patchSession(sessionId, { sentToWallet: true }),
          radixConnectRelayApi.sendHandshakeRequest(
            sessionId,
            dAppIdentity.getPublicKey(),
          ),
          deepLinkClient.deepLinkToWallet(
            {
              sessionId,
              origin,
            },
            childWindow,
          ),
        ]),
      )
      .mapErr(() => {
        return SdkError(
          'FailedToUpdateSession',
          walletInteraction.interactionId,
        )
      })
      .andThen(() =>
        requestItemClient
          .waitForWalletResponse(walletInteraction.interactionId)
          .map((item) => item.walletResponse!),
      )
  }

  const sendEncryptedRequest = (
    activeSession: ActiveSession,
    walletInteraction: WalletInteraction,
  ) =>
    radixConnectRelayApi.sendRequest(
      activeSession.sessionId,
      activeSession.sharedSecret,
      walletInteraction,
    )

  const sendToWallet = (
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
          : resume(session, walletInteraction.interactionId)
      })

  const handleWalletCallback = (values: Record<string, string>) => {
    const { sessionId } = values
    if (sessionId) {
      return sessionClient.getSessionById(sessionId).andThen((session) => {
        if (session?.status === 'Pending' && session.sentToWallet) {
          return radixConnectRelayApi
            .getHandshakeResponse(session.sessionId)
            .andThen((walletPublicKey) => {
              return sessionClient
                .convertToActiveSession(sessionId, walletPublicKey)
                .mapErr((err) => {
                  alert(JSON.stringify({ err }))
                  return err
                })
            })
            .andThen((activeSession) => {
              return requestItemClient.getPendingItems().andThen(([item]) =>
                ResultAsync.combine([
                  deepLinkClient.deepLinkToWallet({
                    sessionId,
                    interactionId: item.interactionId,
                  }),
                  radixConnectRelayApi.sendRequest(
                    sessionId,
                    activeSession.sharedSecret,
                    item.walletInteraction,
                  ),
                  requestItemClient.patch(
                    item.walletInteraction.interactionId,
                    {
                      sentToWallet: true,
                    },
                  ),
                ]),
              )
            })
        } else if (session?.status === 'Active') {
          return requestItemClient.getPendingItems().andThen((items) => {
            const pendingIds = new Set(items.map((item) => item.interactionId))
            return radixConnectRelayApi
              .getResponses(session)
              .map((items) =>
                items.filter((item) => pendingIds.has(item.interactionId)),
              )
              .andThen((walletResponses) =>
                ResultAsync.combine(
                  walletResponses.map((walletResponse) =>
                    requestItemClient.patch(walletResponse.interactionId, {
                      walletResponse,
                    }),
                  ),
                ).map(() => {
                  if (walletResponses.length) window.close()
                }),
              )
          })
        }

        return errAsync(SdkError('SessionNotFound', sessionId))
      })
    }
    return okAsync(undefined)
  }

  subscriptions.add(
    deepLinkClient.walletResponse$
      .pipe(
        filter((values) => Object.values(values).length > 0),
        switchMap((item) => handleWalletCallback(item)),
      )
      .subscribe(),
  )

  deepLinkClient.handleWalletCallback()

  const resume = (session: ActiveSession, interactionId: string) => {
    const url = new URL(`${origin}/connect`)
    // url.hash = 'connect'
    url.searchParams.set('sessionId', session.sessionId)
    url.searchParams.set('interactionId', interactionId)
    const childWindow = window.open(url.toString())!

    return requestItemClient
      .getPendingItems()
      .mapErr(() => SdkError('FailedToGetPendingItems', interactionId))
      .andThen((pendingItems) => {
        const pendingItem = pendingItems.find(
          (item) => item.interactionId === interactionId,
        )
        if (pendingItem) {
          return ResultAsync.combine([
            requestItemClient.patch(interactionId, { sentToWallet: true }),
            sendEncryptedRequest(session, pendingItem.walletInteraction),
            deepLinkClient.deepLinkToWallet(
              {
                sessionId: session.sessionId,
                interactionId: pendingItem.interactionId,
              },
              childWindow,
            ),
          ])

          // requestItemClient
          //   .patch(interactionId, { sentToWallet: true })
          //   .andThen(() =>
          //     sendEncryptedRequest(session, pendingItem.walletInteraction),
          //   )
          //   .andThen(() =>
          //     deepLinkClient.deepLinkToWallet(
          //       {
          //         sessionId: session.sessionId,
          //         interactionId: pendingItem.interactionId,
          //       },
          //       childWindow,
          //     ),
          //   )
        }
        return errAsync(SdkError('PendingItemNotFound', ''))
      })
      .mapErr(() => SdkError('FailedToSendDappRequest', interactionId))
      .andThen(() =>
        requestItemClient
          .waitForWalletResponse(interactionId)
          .map((item) => item.walletResponse!),
      )
  }

  return {
    isSupported: () => isMobile(),
    send: sendToWallet,
    disconnect: () => {},
    destroy: () => {
      subscriptions.unsubscribe()
    },
  }
}
