import { ConnectorExtensionSubjects } from './subjects'

import { Err, Result, ResultAsync, err, ok, okAsync } from 'neverthrow'
import {
  Subject,
  Subscription,
  filter,
  first,
  firstValueFrom,
  map,
  merge,
  mergeMap,
  of,
  race,
  share,
  shareReplay,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs'
import { Logger, isMobile, unwrapObservable } from '../../../../helpers'
import {
  CallbackFns,
  IncomingMessage,
  MessageLifeCycleExtensionStatusEvent,
  WalletInteraction,
  WalletInteractionExtensionInteraction,
  WalletInteractionResponse,
  eventType,
} from '../../../../schemas'
import { RequestItemModule } from '../../request-items'
import { StorageModule } from '../../../storage'
import { SdkError } from '../../../../error'
import { TransportProvider } from '../../../../_types'
import { nanoid } from 'nanoid'

export type ConnectorExtensionModule = ReturnType<
  typeof ConnectorExtensionModule
>

export const ConnectorExtensionModule = (input: {
  subjects?: ConnectorExtensionSubjects
  logger?: Logger
  extensionDetectionTime?: number
  providers: {
    requestItemModule: RequestItemModule
    storageModule: StorageModule<{ sessionId?: string }>
  }
}) => {
  let isExtensionHandlingSessions = false
  const logger = input?.logger?.getSubLogger({
    name: 'ConnectorExtensionModule',
  })

  const subjects = input?.subjects ?? ConnectorExtensionSubjects()
  const subscription = new Subscription()
  const extensionDetectionTime = input?.extensionDetectionTime ?? 100
  const requestItemModule = input.providers.requestItemModule
  const storage =
    input.providers.storageModule.getPartition('connectorExtension')

  subscription.add(
    subjects.incomingMessageSubject
      .pipe(
        tap((message) => {
          logger?.debug({
            method: 'incomingMessageSubject',
            message,
          })
          if ('eventType' in message) {
            subjects.messageLifeCycleEventSubject.next(message)
          } else {
            subjects.responseSubject.next(message)
          }
        }),
      )
      .subscribe(),
  )
  subscription.add(
    subjects.outgoingMessageSubject
      .pipe(
        tap((payload) => {
          logger?.debug({
            method: 'outgoingMessageSubject',
            payload,
          })
          window.dispatchEvent(
            new CustomEvent(eventType.outgoingMessage, {
              detail: payload,
            }),
          )
        }),
      )
      .subscribe(),
  )

  const wrapOutgoingInteraction = (
    interaction: WalletInteraction,
  ): ResultAsync<
    WalletInteractionExtensionInteraction | WalletInteraction,
    Error
  > => {
    if (!isExtensionHandlingSessions) {
      return okAsync(interaction)
    }
    return storage.getState().andThen((state) => {
      const isAuthorizedRequest =
        interaction.items.discriminator === 'authorizedRequest'

      const sessionId = isAuthorizedRequest
        ? state?.sessionId || nanoid()
        : state?.sessionId

      const wrappedRequest = {
        interactionId: interaction.interactionId,
        interaction,
        sessionId,
        discriminator: 'walletInteraction' as const,
      }
      return isAuthorizedRequest
        ? storage.setState({ sessionId }).map(() => wrappedRequest)
        : okAsync(wrappedRequest)
    })
  }

  const handleIncomingMessage = (event: Event) => {
    const message = (event as CustomEvent<IncomingMessage>).detail
    subjects.incomingMessageSubject.next(message)
  }

  addEventListener(eventType.incomingMessage, handleIncomingMessage)

  const sendWalletInteraction = (
    walletInteraction: WalletInteraction,
    callbackFns: Partial<CallbackFns>,
  ): ResultAsync<unknown, SdkError> => {
    const cancelRequestSubject = new Subject<Err<never, SdkError>>()

    const walletResponse$ = subjects.responseSubject.pipe(
      filter(
        (response) =>
          response.interactionId === walletInteraction.interactionId,
      ),
      mergeMap(
        (walletResponse): ResultAsync<WalletInteractionResponse, SdkError> =>
          requestItemModule
            .patch(walletResponse.interactionId, {
              walletResponse,
            })
            .mapErr(() =>
              SdkError('requestItemPatchError', walletResponse.interactionId),
            )
            .map(() => walletResponse),
      ),
    )

    const cancelResponse$ = subjects.messageLifeCycleEventSubject.pipe(
      filter(
        ({ interactionId, eventType }) =>
          walletInteraction.interactionId === interactionId &&
          ['requestCancelSuccess', 'requestCancelFail'].includes(eventType),
      ),
      map((message) => {
        const error = SdkError('canceledByUser', message.interactionId)
        logger?.debug(`🔵⬆️❌ walletRequestCanceled`, error)
        return message
      }),
    )

    const sendCancelRequest = () => {
      subjects.outgoingMessageSubject.next({
        interactionId: walletInteraction.interactionId,
        metadata: walletInteraction.metadata,
        ...(isExtensionHandlingSessions
          ? { discriminator: 'cancelWalletInteraction' }
          : { items: { discriminator: 'cancelRequest' } }),
      })

      setTimeout(() => {
        cancelRequestSubject.next(
          err(SdkError('canceledByUser', walletInteraction.interactionId)),
        )
      })

      return ResultAsync.fromSafePromise(
        firstValueFrom(
          merge(
            walletResponse$.pipe(map(() => 'requestCancelFail')),
            cancelResponse$.pipe(map(({ eventType }) => eventType)),
          ),
        ),
      )
    }

    if (callbackFns.requestControl)
      callbackFns.requestControl({
        cancelRequest: () =>
          sendCancelRequest().andThen(
            (eventType): Result<'requestCancelSuccess', 'requestCancelFail'> =>
              eventType === 'requestCancelSuccess'
                ? ok('requestCancelSuccess')
                : err('requestCancelFail'),
          ),
        getRequest: () => walletInteraction,
      })

    const walletResponseOrCancelRequest$ = merge(
      walletResponse$,
      cancelRequestSubject,
    ).pipe(first())

    const messageLifeCycleEvent$ = subjects.messageLifeCycleEventSubject.pipe(
      filter(
        ({ interactionId }) =>
          walletInteraction.interactionId === interactionId,
      ),
      tap((event) => {
        if (callbackFns.eventCallback)
          callbackFns.eventCallback(event.eventType)
      }),
      takeUntil(walletResponse$),
      share(),
    )

    const messageEventSubscription = messageLifeCycleEvent$.subscribe()

    const missingExtensionError$ = timer(extensionDetectionTime).pipe(
      map(() =>
        err(SdkError('missingExtension', walletInteraction.interactionId)),
      ),
    )

    const extensionMissingError$ = merge(
      missingExtensionError$,
      messageLifeCycleEvent$,
    ).pipe(
      first(),
      filter((value): value is Err<never, SdkError> => !('eventType' in value)),
    )

    const sendWalletRequest$ = of(
      wrapOutgoingInteraction(walletInteraction),
    ).pipe(
      tap((result) => {
        result.map((message) => {
          subjects.outgoingMessageSubject.next(message)
        })
      }),
      filter((_): _ is never => false),
    )

    return unwrapObservable(
      merge(
        walletResponseOrCancelRequest$,
        extensionMissingError$,
        sendWalletRequest$,
      ).pipe(
        tap(() => {
          messageEventSubscription.unsubscribe()
        }),
      ),
    )
  }

  const extensionStatusEvent$ = subjects.messageLifeCycleEventSubject.pipe(
    filter(
      (event): event is MessageLifeCycleExtensionStatusEvent =>
        event.eventType === 'extensionStatus',
    ),
  )

  const extensionStatus$ = of(true).pipe(
    tap(() => {
      subjects.outgoingMessageSubject.next({
        interactionId: nanoid(),
        discriminator: 'extensionStatus',
      })
    }),
    switchMap(() =>
      race(
        extensionStatusEvent$,
        merge(
          extensionStatusEvent$,
          timer(extensionDetectionTime).pipe(
            map(
              () =>
                ({
                  eventType: 'extensionStatus',
                  isWalletLinked: false,
                  isExtensionAvailable: false,
                  canHandleSessions: false,
                }) as MessageLifeCycleExtensionStatusEvent,
            ),
          ),
        ),
      ),
    ),
    tap((event) => {
      isExtensionHandlingSessions = event.canHandleSessions || false
    }),
    shareReplay(1),
  )

  return {
    id: 'connector-extension' as const,
    isSupported: () => !isMobile(),
    send: sendWalletInteraction,
    isAvailable$: extensionStatus$.pipe(
      map(({ isExtensionAvailable }) => isExtensionAvailable),
    ),
    isLinked$: extensionStatus$.pipe(
      map(({ isWalletLinked }) => isWalletLinked),
    ),
    showQrCode: () => {
      window.dispatchEvent(
        new CustomEvent(eventType.outgoingMessage, {
          detail: { discriminator: 'openPopup' },
        }),
      )
    },
    disconnect: () => {
      storage.clear()
    },
    destroy: () => {
      subscription.unsubscribe()
      removeEventListener(eventType.incomingMessage, handleIncomingMessage)
    },
  } satisfies TransportProvider
}
