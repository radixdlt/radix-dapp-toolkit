import {
  filter,
  first,
  fromEvent,
  map,
  merge,
  mergeMap,
  of,
  Subscription,
  switchMap,
  tap,
  timer,
} from 'rxjs'
import type { ConnectButton } from '@radixdlt/connect-button'
import type {
  Account,
  RadixButtonStatus,
  RadixButtonTheme,
  RequestItem,
} from 'radix-connect-common'
import { ConnectButtonSubjects } from './subjects'
import { type Logger } from '../helpers'
import { ConnectButtonProvider, ExplorerConfig } from '../_types'
import {
  RadixConnectRelayClient,
  transformWalletDataToConnectButton,
  WalletRequestClient,
} from '../wallet-request'
import { GatewayClient } from '../gateway/gateway'
import { StateClient } from '../state'
import { RadixNetworkConfigById } from '../gateway/types'
import { LocalStorageClient, StorageProvider } from '../storage'

export type ConnectButtonClient = ReturnType<typeof ConnectButtonClient>

export const ConnectButtonClient = (input: {
  networkId: number
  environment?: string
  dAppDefinitionAddress?: string
  onConnect?: (done: (input?: { challenge: string }) => void) => void
  subjects?: ConnectButtonSubjects
  logger?: Logger
  onDisconnect?: () => void
  explorer?: ExplorerConfig
  enableMobile?: boolean
  providers: {
    stateClient: StateClient
    gatewayClient: GatewayClient
    walletRequestClient: WalletRequestClient
    storageClient?: StorageProvider
  }
}): ConnectButtonProvider => {
  import('@radixdlt/connect-button')
  const logger = input?.logger?.getSubLogger({ name: 'ConnectButtonClient' })
  const subjects = input.subjects || ConnectButtonSubjects()
  const dAppDefinitionAddress = input.dAppDefinitionAddress
  const { baseUrl, accountsPath, transactionPath } = input.explorer ?? {
    baseUrl: RadixNetworkConfigById[input.networkId].dashboardUrl,
    transactionPath: '/transaction/',
    accountsPath: '/account/',
  }
  const statusStorage =
    input.providers?.storageClient ??
    LocalStorageClient(
      `rdt:${dAppDefinitionAddress}:${input.networkId}`,
      'connectButtonStatus',
    )

  const stateClient = input.providers.stateClient
  const gatewayClient = input.providers.gatewayClient
  const enableMobile = input.enableMobile ?? false

  const walletRequestClient = input.providers.walletRequestClient
  const onConnectDefault = (done: (input?: { challenge: string }) => void) => {
    done()
  }
  const onConnect = input.onConnect || onConnectDefault
  const transport = walletRequestClient.getTransport()

  const getConnectButtonElement = (): ConnectButton | null =>
    document.querySelector('radix-connect-button')

  const subscriptions = new Subscription()

  subscriptions.add(
    merge(
      fromEvent(document, 'onRender'),
      of(getConnectButtonElement()).pipe(filter((e) => !!e)),
    )
      .pipe(
        map(() => getConnectButtonElement()),
        filter((element): element is ConnectButton => !!element),
        first(),
        switchMap((connectButtonElement) => {
          logger?.debug({ event: `connectButtonDiscovered` })

          connectButtonElement.enableMobile = enableMobile

          if (transport?.sessionChange$)
            subscriptions.add(
              transport.sessionChange$.subscribe(() => {
                setTimeout(() => {
                  connectButtonElement.showPopoverMenu = true
                  connectButtonElement.showLinking = true
                  connectButtonElement.pristine = false
                }, 1000)
              }),
            )

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
            tap(() => {
              logger?.debug(`connectButtonRemovedFromDOM`)
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

          const onUpdateSharedData$ = fromEvent(
            connectButtonElement,
            'onUpdateSharedData',
          ).pipe(
            tap(() => {
              logger?.debug(`onUpdateSharedData`)
              subjects.onUpdateSharedData.next()
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
            onLinkClick$,
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
          if (['account', 'transaction'].includes(type)) {
            if (!baseUrl || !window) return

            const url = `${baseUrl}${
              type === 'transaction' ? transactionPath : accountsPath
            }${data}`

            window.open(url)
          } else if (type === 'setupGuide')
            window.open('https://wallet.radixdlt.com')
          else if (type === 'showQrCode' && transport?.showQrCode)
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
    disconnect: () => {
      subjects.connected.next(false)
      subjects.status.next('default')
    },
    destroy: () => {
      subscriptions.unsubscribe()
    },
  }

  const setPropsFromState = () =>
    stateClient.getState().map((state) => {
      const { personaData, accounts, personaLabel, connected } =
        transformWalletDataToConnectButton(state.walletData)

      connectButtonApi.setLoggedInTimestamp(state.loggedInTimestamp)
      connectButtonApi.setAccounts(accounts)
      connectButtonApi.setPersonaData(personaData)
      connectButtonApi.setPersonaLabel(personaLabel)
      connectButtonApi.setConnected(connected)
    })

  subscriptions.add(
    merge(stateClient.store.storage$, of(null))
      .pipe(switchMap(() => setPropsFromState()))
      .subscribe(),
  )

  subscriptions.add(
    subjects.onCancelRequestItem
      .pipe(
        tap((value) => {
          walletRequestClient.cancelRequest(value)
        }),
      )
      .subscribe(),
  )

  subscriptions.add(
    walletRequestClient.requestItems$
      .pipe(
        tap((items) => {
          const hasPendingItem = items.find((item) => item.status === 'pending')

          if (hasPendingItem) {
            connectButtonApi.setStatus('pending')
          }

          connectButtonApi.setRequestItems([...items].reverse())
        }),
      )
      .subscribe(),
  )

  subscriptions.add(
    subjects.onShowPopover
      .pipe(
        tap(() => {
          walletRequestClient.getPendingRequests().map((pendingRequests) => {
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
          stateClient.reset().andThen(() =>
            walletRequestClient.sendRequest({
              isConnect: true,
              oneTime: false,
            }),
          ),
        ),
      )
      .subscribe(),
  )

  subscriptions.add(
    subjects.onUpdateSharedData
      .pipe(switchMap(() => walletRequestClient.updateSharedData()))
      .subscribe(),
  )

  subscriptions.add(
    subjects.onDisconnect
      .pipe(
        tap(() => {
          subjects.connected.next(false)
          subjects.status.next('default')
          walletRequestClient.disconnect()
          if (input.onDisconnect) input.onDisconnect()
        }),
      )
      .subscribe(),
  )

  subscriptions.add(
    statusStorage.storage$
      .pipe(
        tap(({ newValue }) => {
          if (newValue?.status) {
            subjects.status.next(newValue.status)
          }
        }),
      )
      .subscribe(),
  )

  subscriptions.add(
    walletRequestClient.interactionStatusChange$
      .pipe(
        mergeMap((newStatus) => {
          statusStorage.setState({
            status: newStatus === 'success' ? 'success' : 'error',
          })

          return timer(2000).pipe(
            tap(() => {
              const result = walletRequestClient.getPendingRequests()
              result.map((pendingItems) => {
                statusStorage.setState({
                  status: pendingItems.length ? 'pending' : 'default',
                })
              })
            }),
          )
        }),
      )
      .subscribe(),
  )

  if (dAppDefinitionAddress) {
    gatewayClient.gatewayApi
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
