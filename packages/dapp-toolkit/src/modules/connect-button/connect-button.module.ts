import {
  concatMap,
  delay,
  filter,
  finalize,
  first,
  from,
  fromEvent,
  map,
  merge,
  mergeMap,
  of,
  Subscription,
  switchMap,
  tap,
} from 'rxjs'
import { ConnectButton } from '@radixdlt/connect-button'
import type {
  Account,
  RadixButtonTheme,
  RequestItem,
} from 'radix-connect-common'
import { ConnectButtonSubjects } from './subjects'
import { type Logger } from '../../helpers'
import { ExplorerConfig } from '../../_types'
import {
  transformWalletDataToConnectButton,
  WalletRequestModule,
} from '../wallet-request'
import { GatewayModule, RadixNetworkConfigById } from '../gateway'
import { StateModule } from '../state'
import { ConnectButtonModuleOutput } from './types'
import { ConnectButtonNoopModule } from './connect-button-noop.module'
import { EnvironmentModule } from '../environment'

export type ConnectButtonModule = ReturnType<typeof ConnectButtonModule>

export type ConnectButtonModuleInput = {
  networkId: number
  environment?: string
  dAppDefinitionAddress?: string
  onConnect?: (done: (input?: { challenge: string }) => void) => void
  subjects?: ConnectButtonSubjects
  logger?: Logger
  onDisconnect?: () => void
  explorer?: ExplorerConfig
  providers: {
    stateModule: StateModule
    gatewayModule: GatewayModule
    environmentModule: EnvironmentModule
    walletRequestModule: WalletRequestModule
  }
}

export const ConnectButtonModule = (
  input: ConnectButtonModuleInput,
): ConnectButtonModuleOutput => {
  if (!input.providers.environmentModule.isBrowser()) {
    return ConnectButtonNoopModule()
  }

  import('@radixdlt/connect-button')
  const logger = input?.logger?.getSubLogger({ name: 'ConnectButtonModule' })
  const subjects =
    input.subjects ||
    ConnectButtonSubjects({
      providers: { environmentModule: input.providers.environmentModule },
    })
  const dAppDefinitionAddress = input.dAppDefinitionAddress
  const { baseUrl, accountsPath, transactionPath, subintentPath } =
    input.explorer ?? {
      baseUrl: RadixNetworkConfigById[input.networkId].dashboardUrl,
      transactionPath: '/transaction/',
      subintentPath: '/subintent/',
      accountsPath: '/account/',
    }

  const stateModule = input.providers.stateModule
  const gatewayModule = input.providers.gatewayModule

  const walletRequestModule = input.providers.walletRequestModule

  const onConnectDefault = (done: (input?: { challenge: string }) => void) => {
    done()
  }
  const onConnect = input.onConnect || onConnectDefault
  const transport = walletRequestModule.getTransport()

  const getConnectButtonElement = (): ConnectButton | null =>
    document.querySelector('radix-connect-button')

  const subscriptions = new Subscription()

  const onConnectButtonRender$ = fromEvent(input.providers.environmentModule.globalThis, 'onConnectButtonRender')

  subscriptions.add(
    onConnectButtonRender$
      .pipe(
        map(() => getConnectButtonElement()),
        filter((element): element is ConnectButton => !!element),
        switchMap((connectButtonElement) => {
          logger?.debug({ observable: `onConnectButtonRender$` })

          const onConnect$ = fromEvent(connectButtonElement, 'onConnect').pipe(
            tap(() => {
              onConnect((value) => subjects.onConnect.next(value))
            }),
          )

          const onDisconnect$ = fromEvent(
            connectButtonElement,
            'onDisconnect',
          ).pipe(tap(() => subjects.onDisconnect.next()))

          const onLinkClick$ = fromEvent<
            CustomEvent<{
              type: 'account' | 'transaction'
              data: string
            }>
          >(connectButtonElement, 'onLinkClick').pipe(
            tap((ev) => {
              subjects.onLinkClick.next(ev.detail)
            }),
          )

          const onDestroy$ = fromEvent(connectButtonElement, 'onDestroy').pipe(
            map(() => {
              logger?.debug({ observable: `onDestroy$` })
              return true
            }),
          )

          const onCancelRequestItem$ = fromEvent(
            connectButtonElement,
            'onCancelRequestItem',
          ).pipe(
            tap((event) => {
              const id = (event as CustomEvent<{ id: string }>).detail.id
              logger?.debug({ method: 'onCancelRequestItem', id })
              subjects.onCancelRequestItem.next(id)
            }),
          )

          const onIgnoreTransactionItem$ = fromEvent(
            connectButtonElement,
            'onIgnoreTransactionItem',
          ).pipe(
            tap((event) => {
              const id = (event as CustomEvent<{ id: string }>).detail.id

              logger?.debug({
                method: 'onIgnoreTransactionItem',
                id,
              })
              subjects.onIgnoreTransactionItem.next(id)
            }),
          )

          const onUpdateSharedAccounts$ = fromEvent(
            connectButtonElement,
            'onUpdateSharedAccounts',
          ).pipe(
            tap(() => {
              logger?.debug(`onUpdateSharedAccounts`)
              subjects.onUpdateSharedAccounts.next()
            }),
          )

          const onShowPopover$ = fromEvent(
            connectButtonElement,
            'onShowPopover',
          ).pipe(tap(() => subjects.onShowPopover.next()))

          const isWalletLinked$ = subjects.isWalletLinked.pipe(
            tap((value) => (connectButtonElement.isWalletLinked = value)),
          )

          const isExtensionAvailable$ = subjects.isExtensionAvailable.pipe(
            tap((value) => (connectButtonElement.isExtensionAvailable = value)),
          )

          const status$ = subjects.status.pipe(
            tap((value) => (connectButtonElement.status = value)),
          )

          const mode$ = subjects.mode.pipe(
            tap((value) => (connectButtonElement.mode = value)),
          )

          const connected$ = subjects.connected.pipe(
            tap((value) => (connectButtonElement.connected = value)),
          )

          const isMobile$ = subjects.isMobile.pipe(
            tap((value) => (connectButtonElement.isMobile = value)),
          )

          const loggedInTimestamp$ = subjects.loggedInTimestamp.pipe(
            tap((value) => (connectButtonElement.loggedInTimestamp = value)),
          )

          const activeTab$ = subjects.activeTab.pipe(
            tap((value) => (connectButtonElement.activeTab = value)),
          )

          const requestItems$ = subjects.requestItems.pipe(
            tap((items) => (connectButtonElement.requestItems = items)),
          )

          const showPopoverMenu$ = subjects.showPopoverMenu.pipe(
            tap((value) => {
              value
                ? connectButtonElement.setAttribute('showPopoverMenu', 'true')
                : connectButtonElement.removeAttribute('showPopoverMenu')
            }),
          )

          const accounts$ = subjects.accounts.pipe(
            tap((items) => (connectButtonElement.accounts = items)),
          )

          const personaData$ = subjects.personaData.pipe(
            tap((items) => (connectButtonElement.personaData = items)),
          )

          const personaLabel$ = subjects.personaLabel.pipe(
            tap((items) => (connectButtonElement.personaLabel = items)),
          )

          const dAppName$ = subjects.dAppName.pipe(
            tap((value) => (connectButtonElement.dAppName = value)),
          )

          const theme$ = subjects.theme.pipe(
            tap((value) => (connectButtonElement.theme = value)),
          )

          const connectButtonEvents$ = merge(
            onConnect$,
            status$,
            theme$,
            mode$,
            connected$,
            showPopoverMenu$,
            requestItems$,
            loggedInTimestamp$,
            isMobile$,
            activeTab$,
            isWalletLinked$,
            isExtensionAvailable$,
            onDisconnect$,
            onCancelRequestItem$,
            onIgnoreTransactionItem$,
            accounts$,
            personaData$,
            personaLabel$,
            onUpdateSharedAccounts$,
            onShowPopover$,
            dAppName$,
            onLinkClick$,
          ).pipe(map(() => false))

          return merge(connectButtonEvents$, onDestroy$).pipe(
            filter((shouldDestroy) => !!shouldDestroy),
            first(),
            finalize(() => {
              logger?.debug({ observable: `onConnectButtonRender$.finalize` })
            }),
          )
        }),
      )

      .subscribe(),
  )

  subscriptions.add(
    ((transport && transport.isAvailable$) || of(true))
      .pipe(tap((value) => subjects.isExtensionAvailable.next(value)))
      .subscribe(),
  )

  subscriptions.add(
    ((transport && transport.isLinked$) || of(true))
      .pipe(tap((value) => subjects.isWalletLinked.next(value)))
      .subscribe(),
  )

  subscriptions.add(
    subjects.onLinkClick
      .pipe(
        tap(({ type, data }) => {
          if (['account', 'transaction', 'subintent'].includes(type)) {
            if (!baseUrl || !window) return

            const url = `${baseUrl}${
              type === 'transaction'
                ? transactionPath
                : type === 'subintent'
                  ? subintentPath
                  : accountsPath
            }${data}`

            window.open(url)
          } else if (type === 'setupGuide')
            window.open('https://wallet.radixdlt.com')
          else if (type === 'getWallet') {
            window.open('https://app.radixdlt.com/qr-code')
          } else if (type === 'showQrCode' && transport?.showQrCode)
            transport.showQrCode()
        }),
      )
      .subscribe(),
  )

  const connectButtonApi = {
    status$: subjects.status.asObservable(),
    onConnect$: subjects.onConnect.asObservable(),
    onDisconnect$: subjects.onDisconnect.asObservable(),
    onShowPopover$: subjects.onShowPopover.asObservable(),
    onUpdateSharedAccounts$: subjects.onUpdateSharedAccounts.asObservable(),
    onCancelRequestItem$: subjects.onCancelRequestItem.asObservable(),
    onIgnoreTransactionItem$: subjects.onIgnoreTransactionItem.asObservable(),
    onLinkClick$: subjects.onLinkClick.asObservable(),
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
    setShowPopoverMenu: (value: boolean) =>
      subjects.showPopoverMenu.next(value),
    setRequestItems: (items: RequestItem[]) =>
      subjects.requestItems.next(items),
    setAccounts: (accounts: Account[]) => subjects.accounts.next(accounts),
    setPersonaData: (personaData: { value: string; field: string }[]) =>
      subjects.personaData.next(personaData),
    setPersonaLabel: (personaLabel: string) =>
      subjects.personaLabel.next(personaLabel),
    setDappName: (dAppName: string) => subjects.dAppName.next(dAppName),
    disconnect: () => {
      subjects.connected.next(false)
      subjects.status.next('default')
    },
    destroy: () => {
      subscriptions.unsubscribe()
    },
  }

  const setPropsFromState = () =>
    stateModule.getState().map((state) => {
      const { personaData, accounts, personaLabel, connected } =
        transformWalletDataToConnectButton(state.walletData)

      connectButtonApi.setLoggedInTimestamp(state.loggedInTimestamp)
      connectButtonApi.setAccounts(accounts)
      connectButtonApi.setPersonaData(personaData)
      connectButtonApi.setPersonaLabel(personaLabel)
      connectButtonApi.setConnected(connected)
    })

  subscriptions.add(
    stateModule.storage$.pipe(switchMap(() => setPropsFromState())).subscribe(),
  )

  subscriptions.add(
    subjects.onCancelRequestItem
      .pipe(
        tap((value) => {
          walletRequestModule.cancelRequest(value)
        }),
      )
      .subscribe(),
  )

  subscriptions.add(
    subjects.onIgnoreTransactionItem
      .pipe(
        tap((value) => {
          walletRequestModule.ignoreTransaction(value)
        }),
      )
      .subscribe(),
  )

  subscriptions.add(
    walletRequestModule.requestItems$
      .pipe(
        tap((items) => {
          connectButtonApi.setRequestItems([...items].reverse())
        }),
      )
      .subscribe(),
  )

  subscriptions.add(
    subjects.onShowPopover
      .pipe(
        tap(() => {
          walletRequestModule.getPendingRequests().map((pendingRequests) => {
            if (pendingRequests.length > 0) {
              subjects.activeTab.next('requests')
            }
          })
        }),
      )
      .subscribe(),
  )

  subscriptions.add(
    subjects.onConnect
      .pipe(
        switchMap(() =>
          stateModule
            .reset()
            .andThen(() =>
              walletRequestModule.sendRequest({
                isConnect: true,
                oneTime: false,
              }),
            )
            .map(
              () =>
                input.providers.environmentModule.isMobile() &&
                subjects.showPopoverMenu.next(false),
            ),
        ),
      )
      .subscribe(),
  )

  subscriptions.add(
    subjects.onUpdateSharedAccounts
      .pipe(switchMap(() => walletRequestModule.updateSharedAccounts()))
      .subscribe(),
  )

  subscriptions.add(
    subjects.onDisconnect
      .pipe(
        tap(() => {
          subjects.connected.next(false)
          subjects.status.next('default')
          walletRequestModule.disconnect()
          if (input.onDisconnect) input.onDisconnect()
        }),
      )
      .subscribe(),
  )

  const setPendingOrDefault = () =>
    walletRequestModule
      .getPendingRequests()
      .andTee((items) =>
        subjects.status.next(items.length ? 'pending' : 'default'),
      )

  subscriptions.add(
    walletRequestModule.interactionStatusChange$
      .pipe(
        mergeMap((newStatus) =>
          of(
            subjects.status.next(
              newStatus === 'success'
                ? 'success'
                : newStatus === 'fail'
                  ? 'error'
                  : 'pending',
            ),
          ).pipe(
            delay(2000),
            concatMap(() => setPendingOrDefault()),
          ),
        ),
      )
      .subscribe(),
  )

  setPendingOrDefault()

  if (dAppDefinitionAddress) {
    gatewayModule.gatewayApi
      .getEntityMetadataPage(dAppDefinitionAddress)
      .map(
        (details) =>
          details?.items.find((item) => item.key === 'name')?.value?.typed
            ?.value,
      )
      .map((dAppName) => {
        subjects.dAppName.next(dAppName ?? 'Unnamed dApp')
      })
  }

  return connectButtonApi
}
