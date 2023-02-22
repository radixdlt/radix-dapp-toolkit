import {
  filter,
  fromEvent,
  map,
  merge,
  Subscription,
  switchMap,
  tap,
} from 'rxjs'
import { Logger } from 'tslog'
import { Account, ConnectButton, RequestItem } from '@radixdlt/connect-button'
import { ConnectButtonProvider } from '../_types'
import { ConnectButtonSubjects } from './subjects'

export type ConnectButtonClient = ReturnType<typeof ConnectButtonClient>

export const ConnectButtonClient = (input: {
  dAppName: string
  explorer?: ConnectButton['explorer']
  onConnect?: (done: (input?: { challenge: string }) => void) => void
  subjects?: ConnectButtonSubjects
  logger?: Logger<unknown>
}): ConnectButtonProvider => {
  if (!import.meta.env.VITE_NO_MJS) import('@radixdlt/connect-button')
  const subjects = input.subjects || ConnectButtonSubjects()
  const logger = input.logger
  const onConnectDefault = (done: (input?: { challenge: string }) => void) => {
    done()
  }
  const onConnect = input.onConnect || onConnectDefault

  const getConnectButtonElement = (): ConnectButton | null =>
    document.querySelector('radix-connect-button')

  const subscriptions = new Subscription()

  subscriptions.add(
    fromEvent(document, 'onRender')
      .pipe(
        map(() => getConnectButtonElement()),
        filter((element): element is ConnectButton => !!element),
        switchMap((connectButtonElement) => {
          logger?.debug(`connectButtonDiscovered`)

          connectButtonElement.dAppName = input.dAppName

          if (input.explorer) connectButtonElement.explorer = input.explorer

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
              logger?.debug(`connectButtonRemovedFromDOM`)
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
            tap((value) => {
              connectButtonElement.connected = value
            })
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
            tap((connecting) => {
              connectButtonElement.connecting = connecting
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
            connecting$,
            onDestroy$
          )
        })
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
