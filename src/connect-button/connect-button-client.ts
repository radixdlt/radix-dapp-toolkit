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
import {
  Account,
  ConnectButton,
  RadixButtonStatus,
  RadixButtonTheme,
  RequestItem,
} from '@radixdlt/connect-button'
import { ConnectButtonProvider } from '../_types'
import { ConnectButtonSubjects } from './subjects'

export const isMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    globalThis.navigator ? globalThis.navigator.userAgent : ''
  )

export type ConnectButtonClient = ReturnType<typeof ConnectButtonClient>

export const ConnectButtonClient = (input: {
  onConnect?: (done: (input?: { challenge: string }) => void) => void
  subjects?: ConnectButtonSubjects
  logger?: Logger<unknown>
}): ConnectButtonProvider => {
  if (import.meta.env.MODE !== 'test') import('@radixdlt/connect-button')
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

          const onConnect$ = fromEvent(connectButtonElement, 'onConnect').pipe(
            tap(() => {
              onConnect((value) => {
                if (
                  !connectButtonElement.isWalletLinked ||
                  !connectButtonElement.isExtensionAvailable
                )
                  return

                subjects.onConnect.next(value)
              })
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

          const onLinkClick$ = fromEvent<
            CustomEvent<{ type: 'account' | 'transaction'; data: string }>
          >(connectButtonElement, 'onLinkClick').pipe(
            tap((ev) => {
              subjects.onLinkClick.next(ev.detail)
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

          const onUpdateSharedData$ = fromEvent(
            connectButtonElement,
            'onUpdateSharedData'
          ).pipe(
            tap(() => {
              logger?.debug(`onUpdateSharedData`)
              subjects.onUpdateSharedData.next()
            })
          )

          const onShowPopover$ = fromEvent(
            connectButtonElement,
            'onShowPopover'
          ).pipe(
            tap(() => {
              subjects.onShowPopover.next()
            })
          )

          const status$ = subjects.status.pipe(
            tap((value) => (connectButtonElement.status = value))
          )

          const mode$ = subjects.mode.pipe(
            tap((value) => (connectButtonElement.mode = value))
          )

          const connected$ = subjects.connected.pipe(
            tap((value) => {
              connectButtonElement.connected = value
            })
          )

          const isMobile$ = subjects.isMobile.pipe(
            tap((value) => {
              connectButtonElement.isMobile = value
            })
          )

          const isWalletLinked$ = subjects.isWalletLinked.pipe(
            tap((value) => {
              connectButtonElement.isWalletLinked = value
            })
          )

          const isExtensionAvailable$ = subjects.isExtensionAvailable.pipe(
            tap((value) => {
              connectButtonElement.isExtensionAvailable = value
            })
          )

          const loggedInTimestamp$ = subjects.loggedInTimestamp.pipe(
            tap((value) => {
              connectButtonElement.loggedInTimestamp = value
            })
          )

          const activeTab$ = subjects.activeTab.pipe(
            tap((value) => {
              connectButtonElement.activeTab = value
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

          const personaData$ = subjects.personaData.pipe(
            tap((items) => {
              // @ts-ignore: TODO: update interface in connect-button
              connectButtonElement.personaData = items
            })
          )

          const personaLabel$ = subjects.personaLabel.pipe(
            tap((items) => {
              connectButtonElement.personaLabel = items
            })
          )

          const dAppName$ = subjects.dAppName.pipe(
            tap((value) => {
              connectButtonElement.dAppName = value
            })
          )

          const theme$ = subjects.theme.pipe(
            tap((value) => {
              connectButtonElement.theme = value
            })
          )

          return merge(
            onConnect$,
            status$,
            theme$,
            mode$,
            connected$,
            requestItems$,
            loggedInTimestamp$,
            isMobile$,
            activeTab$,
            isWalletLinked$,
            isExtensionAvailable$,
            onDisconnect$,
            onCancelRequestItem$,
            accounts$,
            personaData$,
            personaLabel$,
            onDestroy$,
            onUpdateSharedData$,
            onShowPopover$,
            dAppName$,
            onLinkClick$
          )
        })
      )
      .subscribe()
  )

  return {
    status$: subjects.status.asObservable(),
    onConnect$: subjects.onConnect.asObservable(),
    onDisconnect$: subjects.onDisconnect.asObservable(),
    onShowPopover$: subjects.onShowPopover.asObservable(),
    onUpdateSharedData$: subjects.onUpdateSharedData.asObservable(),
    onCancelRequestItem$: subjects.onCancelRequestItem.asObservable(),
    onLinkClick$: subjects.onLinkClick.asObservable(),
    setStatus: (value: RadixButtonStatus) => subjects.status.next(value),
    setTheme: (value: RadixButtonTheme) => subjects.theme.next(value),
    setMode: (value: 'light' | 'dark') => subjects.mode.next(value),
    setActiveTab: (value: 'sharing' | 'requests') =>
      subjects.activeTab.next(value),
    setIsMobile: (value: boolean) => subjects.isMobile.next(value),
    setIsWalletLinked: (value: boolean) => subjects.isWalletLinked.next(value),
    setIsExtensionAvailable: (value: boolean) =>
      subjects.isExtensionAvailable.next(value),
    setLoggedInTimestamp: (value: string) =>
      subjects.loggedInTimestamp.next(value),
    setConnected: (value: boolean) => subjects.connected.next(value),
    setRequestItems: (items: RequestItem[]) =>
      subjects.requestItems.next(items),
    setAccounts: (accounts: Account[]) => subjects.accounts.next(accounts),
    setPersonaData: (personaData: { value: string; field: string }[]) =>
      subjects.personaData.next(personaData),
    setPersonaLabel: (personaLabel: string) =>
      subjects.personaLabel.next(personaLabel),
    setDappName: (dAppName: string) => subjects.dAppName.next(dAppName),
    destroy: () => {
      subscriptions.unsubscribe()
    },
  }
}
