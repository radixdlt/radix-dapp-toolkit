import { Subjects } from './subjects'
import { AppLogger } from '@radixdlt/wallet-sdk'
import {
  CallbackFns,
  IncomingMessage,
  WalletInteraction,
  WalletInteractionSuccessResponse,
  eventType,
} from '@radixdlt/wallet-sdk'
import { Err, Result, ResultAsync, err, ok, okAsync } from 'neverthrow'
import { SdkError, createSdkError } from '@radixdlt/wallet-sdk'
import {
  Subject,
  Subscription,
  filter,
  first,
  firstValueFrom,
  map,
  merge,
  of,
  race,
  share,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs'
import { LocalStorageModule } from './storage'
import {
  WalletInteractionExtensionInteraction,
  MessageLifeCycleExtensionStatusEvent,
} from './schemas'
import { unwrapObservable } from '../helpers/unwrap-observable'

const config = {
  extensionDetectionTime: 100,
}

export type ConnectorExtensionClient = ReturnType<
  typeof ConnectorExtensionClient
>

export const ConnectorExtensionClient = (
  input: Partial<{
    subjects: Subjects
    logger: AppLogger
  }> & {
    metadata: {
      dAppDefinitionAddress: string
      networkId: number
    }
  }
) => {
  let isExtensionHandlingSessions = false
  const logger = input?.logger
  const subjects = input?.subjects ?? Subjects()
  const { dAppDefinitionAddress, networkId } = input.metadata
  const subscription = new Subscription()
  const storage = LocalStorageModule(
    `wallet-sdk:${dAppDefinitionAddress}:${networkId}`
  )

  const wrapOutgoingInteraction = (
    interaction: WalletInteraction
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
        ? state?.sessionId || crypto.randomUUID()
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

  subscription.add(
    subjects.incomingMessageSubject
      .pipe(
        tap((message) => {
          logger?.debug('🔵💬⬇️ incomingMessageSubject', message)
          if ('eventType' in message) {
            subjects.messageLifeCycleEventSubject.next(message)
          } else {
            subjects.responseSubject.next(message)
          }
        })
      )
      .subscribe()
  )
  subscription.add(
    subjects.outgoingMessageSubject
      .pipe(
        tap((payload) => {
          logger?.debug(`🔵⬆️ walletRequest`, payload)
          window.dispatchEvent(
            new CustomEvent(eventType.outgoingMessage, {
              detail: payload,
            })
          )
        })
      )
      .subscribe()
  )

  const handleIncomingMessage = (event: Event) => {
    const message = (event as CustomEvent<IncomingMessage>).detail
    subjects.incomingMessageSubject.next(message)
  }

  addEventListener(eventType.incomingMessage, handleIncomingMessage)

  const sendWalletInteraction = (
    walletInteraction: WalletInteraction,
    callbackFns: Partial<CallbackFns>
  ): ResultAsync<unknown, SdkError> => {
    const cancelRequestSubject = new Subject<Err<never, SdkError>>()

    const walletResponse$ = subjects.responseSubject.pipe(
      filter(
        (response) => response.interactionId === walletInteraction.interactionId
      ),
      map(
        (response): Result<WalletInteractionSuccessResponse, SdkError> =>
          response.discriminator === 'success'
            ? ok(response)
            : err(response as SdkError)
      )
    )

    const cancelResponse$ = subjects.messageLifeCycleEventSubject.pipe(
      filter(
        ({ interactionId, eventType }) =>
          walletInteraction.interactionId === interactionId &&
          ['requestCancelSuccess', 'requestCancelFail'].includes(eventType)
      ),
      map((message) => {
        const error = createSdkError('canceledByUser', message.interactionId)
        logger?.debug(`🔵⬆️❌ walletRequestCanceled`, error)
        return message
      })
    )

    const sendCancelRequest = () => {
      subjects.outgoingMessageSubject.next({
        interactionId: walletInteraction.interactionId,
        metadata: walletInteraction.metadata,
        ...(isExtensionHandlingSessions
          ? { discriminator: 'cancelInteraction' }
          : { items: { discriminator: 'cancelRequest' } }),
      })

      setTimeout(() => {
        cancelRequestSubject.next(
          err(createSdkError('canceledByUser', walletInteraction.interactionId))
        )
      })

      return ResultAsync.fromSafePromise(
        firstValueFrom(
          merge(
            walletResponse$.pipe(map(() => 'requestCancelFail')),
            cancelResponse$.pipe(map(({ eventType }) => eventType))
          )
        )
      )
    }

    if (callbackFns.requestControl)
      callbackFns.requestControl({
        cancelRequest: () =>
          sendCancelRequest().andThen(
            (eventType): Result<'requestCancelSuccess', 'requestCancelFail'> =>
              eventType === 'requestCancelSuccess'
                ? ok('requestCancelSuccess')
                : err('requestCancelFail')
          ),
        getRequest: () => walletInteraction,
      })

    const walletResponseOrCancelRequest$ = merge(
      walletResponse$,
      cancelRequestSubject
    ).pipe(first())

    const messageLifeCycleEvent$ = subjects.messageLifeCycleEventSubject.pipe(
      filter(
        ({ interactionId }) => walletInteraction.interactionId === interactionId
      ),
      tap((event) => {
        if (callbackFns.eventCallback)
          callbackFns.eventCallback(event.eventType)
      }),
      takeUntil(walletResponse$),
      share()
    )

    const messageEventSubscription = messageLifeCycleEvent$.subscribe()

    const missingExtensionError$ = timer(config.extensionDetectionTime).pipe(
      map(() =>
        err(createSdkError('missingExtension', walletInteraction.interactionId))
      )
    )

    const extensionMissingError$ = merge(
      missingExtensionError$,
      messageLifeCycleEvent$
    ).pipe(
      first(),
      filter((value): value is Err<never, SdkError> => !('eventType' in value))
    )

    const sendWalletRequest$ = of(
      wrapOutgoingInteraction(walletInteraction)
    ).pipe(
      tap((result) => {
        result.map((message) => {
          subjects.outgoingMessageSubject.next(message)
        })
      }),
      filter((_): _ is never => false)
    )

    return unwrapObservable(
      merge(
        walletResponseOrCancelRequest$,
        extensionMissingError$,
        sendWalletRequest$
      ).pipe(
        tap(() => {
          messageEventSubscription.unsubscribe()
        })
      )
    )
  }

  const extensionStatusEvent$ = subjects.messageLifeCycleEventSubject.pipe(
    filter(
      (event): event is MessageLifeCycleExtensionStatusEvent =>
        event.eventType === 'extensionStatus'
    )
  )

  return {
    send: sendWalletInteraction,
    destroy: () => {
      subscription.unsubscribe()
      removeEventListener(eventType.incomingMessage, handleIncomingMessage)
    },
    openPopup: () => {
      window.dispatchEvent(
        new CustomEvent(eventType.outgoingMessage, {
          detail: { discriminator: 'openPopup' },
        })
      )
    },
    extensionStatus$: of(true).pipe(
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
            timer(config.extensionDetectionTime).pipe(
              map(
                () =>
                  ({
                    eventType: 'extensionStatus',
                    isWalletLinked: false,
                    isExtensionAvailable: false,
                  } as MessageLifeCycleExtensionStatusEvent)
              )
            )
          )
        )
      ),
      tap((event) => {
        isExtensionHandlingSessions = event.canHandleSessions || false
      })
    ),
  }
}
