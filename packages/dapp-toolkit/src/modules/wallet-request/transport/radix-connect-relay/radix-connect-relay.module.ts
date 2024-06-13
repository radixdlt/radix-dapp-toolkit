import { ResultAsync, err, ok } from 'neverthrow'
import { Subject, Subscription, filter, switchMap } from 'rxjs'
import { EncryptionModule } from '../../encryption'
import {
  ActiveSession,
  PendingSession,
  Session,
  SessionModule,
} from '../../session/session.module'
import type {
  CallbackFns,
  WalletInteraction,
  WalletInteractionResponse,
} from '../../../../schemas'
import { Logger, isMobile } from '../../../../helpers'
import { SdkError } from '../../../../error'
import { DeepLinkModule } from './deep-link.module'
import { IdentityModule } from '../../identity/identity.module'
import { RequestItemModule } from '../../request-items/request-item.module'
import { StorageModule } from '../../../storage'
import { Curve25519 } from '../../crypto'
import { RadixConnectRelayApiService } from './radix-connect-relay-api.service'
import { RequestItem } from 'radix-connect-common'
import type { TransportProvider } from '../../../../_types'
import { RcfmPageModule, RcfmPageState } from './rcfm-page.module'
import { base64urlEncode } from './helpers/base64url'

export type RadixConnectRelayModule = ReturnType<typeof RadixConnectRelayModule>
export const RadixConnectRelayModule = (input: {
  baseUrl: string
  logger?: Logger
  walletUrl: string
  providers: {
    requestItemModule: RequestItemModule
    storageModule: StorageModule
    encryptionModule?: EncryptionModule
    identityModule?: IdentityModule
    sessionModule?: SessionModule
    rcfmPageModule?: RcfmPageModule
    deepLinkModule?: DeepLinkModule
  }
}): TransportProvider => {
  const logger = input.logger?.getSubLogger({ name: 'RadixConnectRelayModule' })
  const { baseUrl, providers, walletUrl } = input
  const { requestItemModule, storageModule } = providers

  const encryptionModule = providers?.encryptionModule ?? EncryptionModule()

  const sessionChangeSubject = new Subject<Session>()

  const deepLinkModule =
    providers?.deepLinkModule ??
    DeepLinkModule({
      logger,
      walletUrl,
      callBackPath: '/connect',
    })

  const rcfmPageModule = providers?.rcfmPageModule ?? RcfmPageModule({ logger })

  const identityModule =
    providers?.identityModule ??
    IdentityModule({
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
        identityModule,
      },
    })

  const radixConnectRelayApiService = RadixConnectRelayApiService({
    baseUrl: `${baseUrl}/api/v1`,
    logger,
    providers: { encryptionModule },
  })

  const subscriptions = new Subscription()

  const sendWalletLinkingRequest = (session: PendingSession) =>
    identityModule
      .get('dApp')
      .mapErr(() => SdkError('FailedToReadIdentity', ''))
      .andThen((dAppIdentity) =>
        sessionModule
          .patchSession(session.sessionId, { sentToWallet: true })
          .mapErr(() => SdkError('FailedToUpdateSession', ''))
          .andThen(() =>
            deepLinkModule.deepLinkToWallet({
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
      .andThen((pendingItem) =>
        requestItemModule
          .patch(walletInteraction.interactionId, { sentToWallet: true })
          .andThen(() =>
            deepLinkModule.deepLinkToWallet({
              sessionId: session.sessionId,
              interactionId: pendingItem.interactionId,
              walletInteraction: base64urlEncode(walletInteraction),
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
      identityModule
        .get('dApp')
        .mapErr(() =>
          SdkError('FailedToGetDappIdentity', walletInteraction.interactionId),
        ),
      sessionModule
        .getCurrentSession()
        .mapErr(() =>
          SdkError('FailedToReadSession', walletInteraction.interactionId),
        ),
    ])
      .andThen(([dAppIdentity, session]) =>
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
    sessionModule
      .getSessionById(sessionId)
      .mapErr(() => SdkError('FailedToReadSession', ''))
      .andThen((session) =>
        session ? ok(session) : err(SdkError('SessionNotFound', '')),
      )
      .andThen((session) =>
        session.status === 'Active'
          ? ok(session)
          : sessionModule
              .convertToActiveSession(sessionId, walletPublicKey)
              .mapErr(() => SdkError('FailedToUpdateSession', '')),
      )
      .andThen((activeSession) => {
        sessionChangeSubject.next(activeSession)
        return requestItemModule
          .getPending()
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
            ? requestItemModule
                .patch(pendingItem.interactionId, {
                  sentToWallet: true,
                })
                .mapErr(() =>
                  SdkError(
                    'FailedToUpdateRequestItem',
                    pendingItem.interactionId,
                  ),
                )
                .andThen(() =>
                  deepLinkModule.deepLinkToWallet({
                    sessionId,
                    interactionId: pendingItem.walletInteraction.interactionId,
                    walletInteraction: base64urlEncode(
                      pendingItem.walletInteraction,
                    ),
                  }),
                )
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
          const sessionResult = await sessionModule.getSessionById(sessionId)

          if (sessionResult.isErr())
            return reject(SdkError('FailedToReadSession', interactionId))

          if (!sessionResult.value) {
            return reject(SdkError('SessionNotFound', interactionId))
          }

          const session = sessionResult.value

          if (session.status === 'Active') {
            await radixConnectRelayApiService
              .getResponses(session)
              .andThen((walletResponses) =>
                ResultAsync.combine(
                  walletResponses.map((walletResponse) =>
                    requestItemModule.patch(walletResponse.interactionId, {
                      walletResponse,
                    }),
                  ),
                ).map(() => walletResponses),
              )
              .andThen(() => requestItemModule.getById(interactionId))
              .map((walletInteraction) => {
                if (walletInteraction) {
                  logger?.debug({
                    method: 'waitForWalletResponse.success',
                    retry,
                    sessionId,
                    interactionId,
                    walletResponse: walletInteraction.walletResponse,
                  })
                  response = walletInteraction.walletResponse
                }
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

          deepLinkModule.deepLinkToWallet({ error: error.error })
        },
      )
    }

    logger?.debug({ method: 'handleWalletCallback.unhandled', values })
  }

  subscriptions.add(
    deepLinkModule.walletResponse$
      .pipe(
        filter((values) => Object.values(values).length > 0),
        switchMap((item) => handleWalletCallback(item)),
      )
      .subscribe(),
  )

  subscriptions.add(
    sessionChangeSubject
      .asObservable()
      .pipe(filter((session) => session.status === 'Active'))
      .subscribe(() => rcfmPageModule.show(RcfmPageState.dAppVerified)),
  )

  deepLinkModule.handleWalletCallback()

  return {
    id: 'radix-connect-relay' as const,
    isSupported: () => isMobile(),
    send: sendToWallet,
    sessionChange$: sessionChangeSubject.asObservable(),
    disconnect: () => {},
    destroy: () => {
      subscriptions.unsubscribe()
    },
  } satisfies TransportProvider
}
