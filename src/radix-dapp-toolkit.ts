import { StateClient } from './state/state'
import {
  ConnectButtonClient,
  isMobile,
} from './connect-button/connect-button-client'
import { WalletClient } from './wallet/wallet-client'
import { WalletSdk } from '@radixdlt/wallet-sdk'
import { GatewayApiClient } from './gateway/gateway-api'
import { GatewayClient, MetadataValue } from './gateway/gateway'
import {
  BehaviorSubject,
  Subscription,
  filter,
  merge,
  of,
  switchMap,
  tap,
  timer,
} from 'rxjs'

import { RequestItemClient } from './request-items/request-item-client'
import { LocalStorageClient } from './storage/local-storage-client'
import { DataRequestClient } from './data-request/data-request'
import { transformWalletDataToConnectButton } from './data-request/transformations/wallet-data-to-connect-button'
import { DataRequestStateClient } from './data-request/data-request-state'
import { RadixNetworkConfigById } from '@radixdlt/babylon-gateway-api-sdk'
import {
  ButtonApi,
  GatewayApi,
  RadixDappToolkitOptions,
  SendTransactionInput,
  WalletApi,
  WalletRequest,
  requestInterceptorFactory,
  RequestInterceptor,
} from './_types'
import { mergeMap, withLatestFrom } from 'rxjs/operators'
import { WalletData } from './state/types'

export type RadixDappToolkit = {
  walletApi: WalletApi
  gatewayApi: GatewayApi
  buttonApi: ButtonApi
  disconnect: () => void
  destroy: () => void
}

export const RadixDappToolkit = (
  options: RadixDappToolkitOptions,
): RadixDappToolkit => {
  const dAppDefinitionAddress =
    options.dAppDefinitionAddress ?? options.applicationDappDefinitionAddress
  const {
    networkId,
    providers,
    logger,
    onDisconnect,
    explorer,
    gatewayBaseUrl,
    applicationName,
    applicationVersion,
    useCache = true,
    requestInterceptor = (async ({ payload }: WalletRequest) =>
      payload) as RequestInterceptor,
  } = options || {}

  const storageKey = `rdt:${dAppDefinitionAddress}:${networkId}`
  const dAppDefinitionAddressSubject = new BehaviorSubject<string>(
    dAppDefinitionAddress,
  )
  const subscriptions = new Subscription()

  const connectButtonClient =
    providers?.connectButton ??
    ConnectButtonClient({
      logger,
    })

  connectButtonClient.setIsMobile(isMobile())

  const gatewayClient =
    providers?.gatewayClient ??
    GatewayClient({
      logger,
      gatewayApi: GatewayApiClient({
        basePath:
          gatewayBaseUrl ?? RadixNetworkConfigById[networkId].gatewayUrl,
        dAppDefinitionAddress,
        applicationName,
        applicationVersion,
      }),
    })

  const storageClient = providers?.storageClient ?? LocalStorageClient()

  const walletSdk =
    providers?.walletSdk ??
    WalletSdk({
      logger,
      networkId,
      dAppDefinitionAddress,
    })

  const requestItemClient =
    providers?.requestItemClient ??
    RequestItemClient(storageKey, storageClient, {
      logger,
    })

  const walletClient =
    providers?.walletClient ??
    WalletClient({
      logger,
      onCancelRequestItem$: connectButtonClient.onCancelRequestItem$,
      walletSdk,
      gatewayClient,
      requestItemClient,
    })

  const stateClient =
    providers?.stateClient ??
    StateClient(storageKey, storageClient, {
      logger,
    })

  const dataRequestStateClient =
    providers?.dataRequestStateClient ?? DataRequestStateClient({})

  const withInterceptor = requestInterceptorFactory(requestInterceptor)

  const dataRequestClient =
    providers?.dataRequestClient ??
    DataRequestClient({
      stateClient,
      requestItemClient,
      walletClient,
      useCache,
      dataRequestStateClient,
      requestInterceptor: withInterceptor,
    })

  const disconnect = () => {
    requestItemClient.items$.value.forEach((item) => {
      if (item.showCancel) walletClient.cancelRequest(item.id)
    })
    stateClient.reset()
    walletClient.resetRequestItems()
    connectButtonClient.disconnect()
    if (onDisconnect) onDisconnect()
  }

  subscriptions.add(
    dAppDefinitionAddressSubject
      .pipe(
        filter((address) => !!address),
        switchMap((address) =>
          gatewayClient.gatewayApi
            .getEntityDetails(address)
            .map(
              (details) =>
                MetadataValue(
                  details?.metadata.items.find((item) => item.key === 'name'),
                ).stringified,
            )
            .map((dAppName) => {
              connectButtonClient.setDappName(dAppName ?? 'Unnamed dApp')
            }),
        ),
      )
      .subscribe(),
  )

  subscriptions.add(
    walletClient.extensionStatus$
      .pipe(
        tap((result) => {
          connectButtonClient.setIsExtensionAvailable(
            result.isExtensionAvailable,
          )
          connectButtonClient.setIsWalletLinked(result.isWalletLinked)
        }),
      )

      .subscribe(),
  )

  subscriptions.add(
    connectButtonClient.onConnect$
      .pipe(
        switchMap(() => {
          stateClient.reset()
          return dataRequestClient.sendRequest({
            isConnect: true,
            oneTime: false,
          })
        }),
      )
      .subscribe(),
  )

  subscriptions.add(
    connectButtonClient.onLinkClick$
      .pipe(
        tap(({ type, data }) => {
          if (['account', 'transaction'].includes(type)) {
            const { baseUrl, transactionPath, accountsPath } = explorer ?? {
              baseUrl: RadixNetworkConfigById[networkId].dashboardUrl,
              transactionPath: '/transaction/',
              accountsPath: '/account/',
            }
            if (!baseUrl || !window) return

            const url = `${baseUrl}${
              type === 'transaction' ? transactionPath : accountsPath
            }${data}`

            window.open(url)
          } else if (type === 'setupGuide')
            window.open('https://wallet.radixdlt.com')
          else if (type === 'showQrCode') {
            walletSdk.openPopup()
          }
        }),
      )
      .subscribe(),
  )

  subscriptions.add(
    connectButtonClient.onShowPopover$
      .pipe(
        withLatestFrom(walletClient.requestItems$),
        tap(([_, items]) => {
          if (items.filter((item) => item.status === 'pending').length > 0) {
            connectButtonClient.setActiveTab('requests')
          }
        }),
      )
      .subscribe(),
  )

  subscriptions.add(
    connectButtonClient.onDisconnect$.pipe(tap(disconnect)).subscribe(),
  )

  subscriptions.add(
    stateClient.state$
      .pipe(
        tap((state) => {
          const { personaData, accounts, personaLabel, connected } =
            transformWalletDataToConnectButton(state.walletData)
          connectButtonClient.setLoggedInTimestamp(state.loggedInTimestamp)
          connectButtonClient.setAccounts(accounts)
          connectButtonClient.setPersonaData(personaData)
          connectButtonClient.setPersonaLabel(personaLabel)
          connectButtonClient.setConnected(connected)
        }),
      )
      .subscribe(),
  )

  subscriptions.add(
    walletClient.requestItems$
      .pipe(tap((items) => connectButtonClient.setRequestItems(items)))
      .subscribe(),
  )

  subscriptions.add(
    requestItemClient.change$
      .pipe(
        withLatestFrom(requestItemClient.items$),
        tap(([, items]) => {
          const hasPendingItem = items.find((item) => item.status === 'pending')

          if (hasPendingItem) {
            connectButtonClient.setStatus('pending')
          }
        }),
        mergeMap(([change]) => {
          const newStatus = change.newValue?.status
          const oldStatus = change.oldValue?.status

          if (
            oldStatus === 'pending' &&
            (newStatus === 'success' || newStatus === 'fail')
          ) {
            connectButtonClient.setStatus(
              newStatus === 'success' ? 'success' : 'error',
            )

            return timer(2000).pipe(
              withLatestFrom(walletClient.requestItems$),
              tap(([_, items]) => {
                const pendingItem = items.find(
                  (item) => item.status === 'pending',
                )
                connectButtonClient.setStatus(
                  pendingItem ? 'pending' : 'default',
                )
              }),
            )
          }

          return of()
        }),
      )
      .subscribe(),
  )

  subscriptions.add(
    merge(connectButtonClient.onUpdateSharedData$)
      .pipe(switchMap(() => dataRequestClient.updateSharedData()))
      .subscribe(),
  )

  const gatewayApi = {
    state: gatewayClient.gatewayApi.stateApi,
    status: gatewayClient.gatewayApi.statusApi,
    transaction: gatewayClient.gatewayApi.transactionApi,
  }

  const walletApi = {
    setRequestData: dataRequestClient.setState,
    sendRequest: () =>
      dataRequestClient.sendRequest({
        isConnect: false,
        oneTime: false,
      }),
    provideChallengeGenerator: (
      input: Parameters<typeof dataRequestClient.provideChallengeGenerator>[0],
    ) => dataRequestClient.provideChallengeGenerator(input),
    dataRequestControl: (fn: (walletData: WalletData) => Promise<any>) => {
      dataRequestClient.provideDataRequestControl(fn)
    },
    provideConnectResponseCallback:
      dataRequestClient.provideConnectResponseCallback,
    updateSharedData: () => dataRequestClient.updateSharedData(),
    sendOneTimeRequest: dataRequestClient.sendOneTimeRequest,
    sendTransaction: (input: SendTransactionInput) =>
      withInterceptor({
        type: 'sendTransaction',
        payload: input,
      }).andThen(walletClient.sendTransaction),
    walletData$: stateClient.walletData$,
    getWalletData: () => stateClient.getWalletData(),
  }

  const buttonApi = {
    setTheme: connectButtonClient.setTheme,
    setMode: connectButtonClient.setMode,
    status$: connectButtonClient.status$,
  }

  const destroy = () => {
    stateClient.destroy()
    walletClient.destroy()
    subscriptions.unsubscribe()
    connectButtonClient.destroy()
  }

  return {
    walletApi,
    gatewayApi,
    buttonApi,
    disconnect,
    destroy,
  }
}
