import {
  filter,
  finalize,
  first,
  fromEvent,
  map,
  merge,
  Subject,
  Subscription,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs'
import { Logger } from 'tslog'
import { Account, ConnectButton, RequestItem } from '@radixdlt/connect-button'
import { ConnectButtonProvider } from '../_types'
import { ConnectButtonSubjects } from './subjects'

export type ConnectButtonClient = ReturnType<typeof ConnectButtonClient>

export const ConnectButtonClient = (input: {
  dAppName: string
  onConnect?: (done: (input?: { challenge: string }) => void) => void
  subjects?: ConnectButtonSubjects
  logger?: Logger<unknown>
}): ConnectButtonProvider => {
  const subjects = input.subjects || ConnectButtonSubjects()
  const logger = input.logger
  const onConnectDefault = (done: (input?: { challenge: string }) => void) => {
    done()
  }
  const onConnect = input.onConnect || onConnectDefault

  const getConnectButtonElement = (): ConnectButton | null =>
    document.querySelector('radix-connect-button')

  const subscriptions = new Subscription()

  const bootStrapConnectButton = new Subject<void>()

  subscriptions.add(
    // TODO: listen to an on CB DOM render event instead using a timer
    merge(bootStrapConnectButton, timer(0, 100))
      .pipe(
        map(() => getConnectButtonElement()),
        filter((element): element is ConnectButton => !!element),
        tap(() => {
          logger?.debug(`connectButtonDiscovered`)
        }),
        first(),
        switchMap((connectButtonElement) => {
          import('@radixdlt/connect-button')

          connectButtonElement.dAppName = input.dAppName

          const onConnect$ = fromEvent(connectButtonElement, 'onConnect').pipe(
            tap(() => {
              onConnect((value) => subjects.onConnect.next(value))
            })
          )

          const onDisconnect$ = fromEvent(
            connectButtonElement,
            'onDisconnect'
          ).pipe(
            tap(() => {
              subjects.onDisconnect.next()
            })
          )

          const onDestroy$ = fromEvent(connectButtonElement, 'onDestroy').pipe(
            tap(() => {
              logger?.debug(`connectButtonRemovedDisconnectedFromDOM`)
            })
          )

          const onCancelRequestItem$ = fromEvent(
            connectButtonElement,
            'onCancelRequestItem'
          ).pipe(
            tap((event) => {
              const id = (event as CustomEvent<{ id: string }>).detail.id
              logger?.debug(`onCancelRequestItem`, { id })
              subjects.onCancelRequestItem.next(id)
            })
          )

          const loading$ = subjects.loading.pipe(
            tap((value) => (connectButtonElement.loading = value))
          )

          const connected$ = subjects.connected.pipe(
            tap((value) => (connectButtonElement.connected = value))
          )

          const requestItems$ = subjects.requestItems.pipe(
            tap((items) => {
              connectButtonElement.requestItems = items
            })
          )

          const accounts$ = subjects.accounts.pipe(
            tap((items) => {
              connectButtonElement.accounts = items
            })
          )

          const personaLabel$ = subjects.personaLabel.pipe(
            tap((items) => {
              connectButtonElement.personaLabel = items
            })
          )

          const connecting$ = subjects.connecting.pipe(
            tap((value) => {
              connectButtonElement.connecting = value
            })
          )

          return merge(
            onConnect$,
            loading$,
            connected$,
            requestItems$,
            onDisconnect$,
            onCancelRequestItem$,
            accounts$,
            personaLabel$,
            connecting$
          ).pipe(takeUntil(onDestroy$))
        }),
        finalize(() => bootStrapConnectButton.next())
      )
      .subscribe()
  )

  return {
    onConnect$: subjects.onConnect.asObservable(),
    onDisconnect$: subjects.onDisconnect.asObservable(),
    onCancelRequestItem$: subjects.onCancelRequestItem.asObservable(),
    setLoading: (value: boolean) => subjects.loading.next(value),
    setConnecting: (value: boolean) => subjects.connecting.next(value),
    setConnected: (value: boolean) => subjects.connected.next(value),
    setRequestItems: (items: RequestItem[]) =>
      subjects.requestItems.next(items),
    setAccounts: (accounts: Account[]) => subjects.accounts.next(accounts),
    setPersonaLabel: (personaLabel: string) =>
      subjects.personaLabel.next(personaLabel),
    destroy: () => {
      subscriptions.unsubscribe()
    },
  }
}
