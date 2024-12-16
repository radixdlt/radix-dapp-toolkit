import { ConnectorExtensionSubjects } from './subjects'

import { Err, Result, ResultAsync, err, ok, okAsync } from 'neverthrow'
import {
  Subject,
  Subscription,
  filter,
  first,
  firstValueFrom,
  from,
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
import { Logger, unwrapObservable } from '../../../../helpers'
import {
  CallbackFns,
  IncomingMessage,
  MessageLifeCycleExtensionStatusEvent,
  WalletInteraction,
  WalletInteractionExtensionInteraction,
  WalletInteractionResponse,
  eventType,
} from '../../../../schemas'
import { StorageModule } from '../../../storage'
import { SdkError } from '../../../../error'
import { TransportProvider } from '../../../../_types'
import { v4 as uuidV4 } from 'uuid'
import type { RequestResolverModule } from '../../request-resolver/request-resolver.module'
import { EnvironmentModule } from '../../../environment'

export type ConnectorExtensionModule = ReturnType<
  typeof ConnectorExtensionModule
>

export const ConnectorExtensionModule = (input: {
  subjects?: ConnectorExtensionSubjects
  logger?: Logger
  extensionDetectionTime?: number
  providers: {
    environmentModule: EnvironmentModule
    requestResolverModule: RequestResolverModule
    storageModule: StorageModule<{ sessionId?: string }>
  }
}) => {
  let isExtensionHandlingSessions = false
  const logger = input?.logger?.getSubLogger({
    name: 'ConnectorExtensionModule',
  })

  const subjects = input?.subjects ?? ConnectorExtensionSubjects()
  const subscription = new Subscription()
  const extensionDetectionTime = input?.extensionDetectionTime ?? 200
  const requestResolverModule = input.providers.requestResolverModule
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
    subjects.responseSubject
      .pipe(
        mergeMap((walletResponse) =>
          from(requestResolverModule.addWalletResponses([walletResponse])),
        ),
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
          input.providers.environmentModule.globalThis.dispatchEvent(
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
        ? state?.sessionId || uuidV4()
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
  ): ResultAsync<WalletInteractionResponse, SdkError> => {
    const cancelRequestSubject = new Subject<Err<never, SdkError>>()

    const maybeResolved$ = from(
      requestResolverModule.getWalletResponseById(
        walletInteraction.interactionId,
      ),
    ).pipe(filter((result) => result.isOk() && !!result.value))

    const walletResponse$ = subjects.responseSubject.pipe(
      filter(
        (response) =>
          response.interactionId === walletInteraction.interactionId,
      ),
      map((walletResponse) => ok(walletResponse)),
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
      maybeResolved$,
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

    const sendWalletRequest$ = extensionStatus$.pipe(
      filter((status) => status.isExtensionAvailable),
      switchMap(() => of(wrapOutgoingInteraction(walletInteraction))),
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
        interactionId: uuidV4(),
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
    isSupported: () => !input.providers.environmentModule.isMobile(),
    send: sendWalletInteraction,
    isAvailable$: extensionStatus$.pipe(
      map(({ isExtensionAvailable }) => isExtensionAvailable),
    ),
    isLinked$: extensionStatus$.pipe(
      map(({ isWalletLinked }) => isWalletLinked),
    ),
    showQrCode: () => {
      input.providers.environmentModule.globalThis.dispatchEvent(
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
