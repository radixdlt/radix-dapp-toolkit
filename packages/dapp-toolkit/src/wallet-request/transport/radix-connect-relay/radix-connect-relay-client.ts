import { ResultAsync, err, ok } from 'neverthrow'
import { Subscription, filter, switchMap } from 'rxjs'
import { EncryptionClient } from '../../encryption'
import {
  ActiveSession,
  PendingSession,
  Session,
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
import { StorageProvider } from '../../../storage'
import { Curve25519 } from '../../crypto'
import { RadixConnectRelayApi } from './api'
import { RequestItem } from 'radix-connect-common'

type SessionChangeEvent = (session: Session) => void

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

  const encryptionClient = providers?.encryptionClient ?? EncryptionClient()

  const sessionChangeListeners: SessionChangeEvent[] = []

  const addSessionChangeListener = (listener: SessionChangeEvent) => {
    sessionChangeListeners.push(listener)
  }

  const emitChangesToListeners = (session: Session) => {
    sessionChangeListeners.forEach((listener) => listener(session))
  }

  const deepLinkClient =
    providers?.deepLinkClient ??
    DeepLinkClient({
      logger,
      walletUrl,
      callBackPath: '/connect',
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

  const sendWalletLinkingRequest = (session: PendingSession) =>
    identityClient
      .get('dApp')
      .mapErr(() => SdkError('FailedToReadIdentity', ''))
      .andThen((dAppIdentity) =>
        sessionClient
          .patchSession(session.sessionId, { sentToWallet: true })
          .mapErr(() => SdkError('FailedToUpdateSession', ''))
          .andThen(() =>
            deepLinkClient.deepLinkToWallet({
              sessionId: session.sessionId,
              origin,
              publicKey: dAppIdentity.getPublicKey(),
            }),
          ),
      )

  const sendWalletInteractionRequest = (
    session: ActiveSession,
    walletInteraction: WalletInteraction,
  ) =>
    requestItemClient
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
      .andThen((pendingItem) =>
        requestItemClient
          .patch(walletInteraction.interactionId, { sentToWallet: true })
          .andThen(() =>
            radixConnectRelayApi.sendRequest(
              session,
              pendingItem.walletInteraction,
            ),
          )
          .andThen(() =>
            deepLinkClient.deepLinkToWallet({
              sessionId: session.sessionId,
              interactionId: pendingItem.interactionId,
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
    sessionClient
      .getCurrentSession()
      .mapErr(() =>
        SdkError('FailedToReadSession', walletInteraction.interactionId),
      )
      .andThen((session) =>
        (session.status === 'Pending'
          ? sendWalletLinkingRequest(session)
          : sendWalletInteractionRequest(session, walletInteraction)
        ).map(() => session),
      )
      .andThen((session) =>
        waitForWalletResponse({
          sessionId: session.sessionId,
          interactionId: walletInteraction.interactionId,
        }),
      )

  // check if session exists
  // -- if not, send error message to wallet
  // generate shared secret
  // update session
  // send encrypted wallet interaction to RCR
  // deep link to wallet with sessionId, interactionId, browser
  const handleWalletLinkingResponse = (
    sessionId: string,
    walletPublicKey: string,
  ) =>
    sessionClient
      .getSessionById(sessionId)
      .mapErr(() => SdkError('FailedToReadSession', ''))
      .andThen((session) =>
        session ? ok(session) : err(SdkError('SessionNotFound', '')),
      )
      .andThen((session) =>
        session.status === 'Active'
          ? ok(session)
          : sessionClient
              .convertToActiveSession(sessionId, walletPublicKey)
              .mapErr(() => SdkError('FailedToUpdateSession', '')),
      )
      .andThen((activeSession) => {
        emitChangesToListeners(activeSession)
        return requestItemClient
          .getPendingRequests()
          .mapErr(() => SdkError('FailedToReadPendingItems', ''))
          .map((items) => {
            const [item] = items.filter(
              (item) => !item.walletResponse && !item.sentToWallet,
            )
            return item
          })

          .map((item) => ({ activeSession, pendingItem: item }))
      })
      .andThen(
        ({
          activeSession,
          pendingItem,
        }: {
          activeSession: ActiveSession
          pendingItem?: RequestItem
        }) =>
          pendingItem
            ? radixConnectRelayApi
                .sendRequest(activeSession, pendingItem.walletInteraction)
                .andThen(() =>
                  requestItemClient
                    .patch(pendingItem.interactionId, {
                      sentToWallet: true,
                    })
                    .mapErr(() =>
                      SdkError(
                        'FailedToUpdateRequestItem',
                        pendingItem.interactionId,
                      ),
                    )
                    .map(() => pendingItem.interactionId),
                )
                .map((interactionId) => {
                  deepLinkClient.deepLinkToWallet({
                    sessionId,
                    interactionId,
                  })
                })
            : ok(pendingItem),
      )

  const waitForWalletResponse = ({
    sessionId,
    interactionId,
  }: {
    sessionId: string
    interactionId: string
  }): ResultAsync<WalletInteractionResponse, SdkError> =>
    ResultAsync.fromPromise(
      new Promise(async (resolve, reject) => {
        let response: WalletInteractionResponse | undefined
        let retry = 0

        const wait = (timer = 1500) =>
          new Promise((resolve) => setTimeout(resolve, timer))

        logger?.debug({
          method: 'waitForWalletResponse',
          sessionId,
          interactionId,
        })

        while (!response) {
          const sessionResult = await sessionClient.getSessionById(sessionId)

          if (sessionResult.isErr())
            return reject(SdkError('FailedToReadSession', interactionId))

          if (!sessionResult.value) {
            return reject(SdkError('SessionNotFound', interactionId))
          }

          const session = sessionResult.value

          if (session.status === 'Active') {
            await radixConnectRelayApi
              .getResponses(session)
              .andThen((walletResponses) =>
                ResultAsync.combine(
                  walletResponses.map((walletResponse) =>
                    requestItemClient.patch(walletResponse.interactionId, {
                      walletResponse,
                    }),
                  ),
                ).map(() => walletResponses),
              )
              .map((walletResponses) => {
                if (walletResponses.length)
                  logger?.debug({
                    method: 'waitForWalletResponse.success',
                    retry,
                    sessionId,
                    interactionId,
                    walletResponses,
                  })
                response = walletResponses.find(
                  (response) => response.interactionId === interactionId,
                )
              })
              .mapErr((error) => {
                logger?.debug({
                  method: 'waitForWalletResponse.error',
                  retry,
                  sessionId,
                  interactionId,
                  error,
                })
              })
          }

          if (!response) {
            retry += 1
            await wait()
          }
        }

        return resolve(response)
      }),
      (err) => err as SdkError,
    )

  const handleWalletCallback = async (values: Record<string, string>) => {
    const { sessionId, publicKey } = values

    const isLinkingResponse = sessionId && publicKey

    if (isLinkingResponse) {
      return handleWalletLinkingResponse(sessionId, publicKey).mapErr(
        (error) => {
          logger?.debug({ method: 'handleWalletLinkingResponse.error', error })

          deepLinkClient.deepLinkToWallet({ error: error.error })
        },
      )
    }

    logger?.debug({ method: 'handleWalletCallback.unhandled', values })
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

  return {
    id: 'radix-connect-relay' as const,
    isSupported: () => isMobile(),
    send: sendToWallet,
    addSessionChangeListener,
    disconnect: () => {},
    destroy: () => {
      subscriptions.unsubscribe()
    },
  }
}
