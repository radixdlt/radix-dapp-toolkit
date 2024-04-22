import { ConnectorExtensionSubjects } from './subjects'

import { Err, Result, ResultAsync, err, ok } from 'neverthrow'
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
import { Logger, isMobile, unwrapObservable } from '../../../helpers'
import {
  CallbackFns,
  IncomingMessage,
  MessageLifeCycleExtensionStatusEvent,
  WalletInteraction,
  WalletInteractionResponse,
  eventType,
} from '../../../schemas'
import { SdkError } from '../../../error'
import { RequestItemClient } from '../../request-items'

export type ConnectorExtensionClient = ReturnType<
  typeof ConnectorExtensionClient
>

export const ConnectorExtensionClient = (input: {
  subjects?: ConnectorExtensionSubjects
  logger?: Logger
  extensionDetectionTime?: number
  providers: {
    requestItemClient: RequestItemClient
  }
}) => {
  const logger = input?.logger?.getSubLogger({
    name: 'ConnectorExtensionClient',
  })
  const subjects = input?.subjects ?? ConnectorExtensionSubjects()
  const subscription = new Subscription()
  const extensionDetectionTime = input?.extensionDetectionTime ?? 100
  const requestItemClient = input.providers.requestItemClient

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
          requestItemClient
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
        items: { discriminator: 'cancelRequest' },
        metadata: walletInteraction.metadata,
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

    const sendWalletRequest$ = of(walletInteraction).pipe(
      tap((message) => {
        subjects.outgoingMessageSubject.next(message)
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
        interactionId: crypto.randomUUID(),
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
                }) as MessageLifeCycleExtensionStatusEvent,
            ),
          ),
        ),
      ),
    ),
    shareReplay(1),
  )

  return {
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
    disconnect: () => {},
    destroy: () => {
      subscription.unsubscribe()
      removeEventListener(eventType.incomingMessage, handleIncomingMessage)
    },
  }
}
