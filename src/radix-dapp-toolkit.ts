import { StateClient } from './state/state'
import { ConnectButtonClient } from './connect-button/connect-button-client'
import { WalletClient } from './wallet/wallet-client'
import { WalletSdk } from '@radixdlt/wallet-sdk'
import { GatewayApiClient } from './gateway/gateway-api'
import { GatewayClient, MetadataValue } from './gateway/gateway'
import {
  BehaviorSubject,
  Subscription,
  filter,
  map,
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
  WalletApi,
} from './_types'
import { mergeMap, withLatestFrom } from 'rxjs/operators'

export type RadixDappToolkit = {
  walletApi: WalletApi
  gatewayApi: GatewayApi
  buttonApi: ButtonApi
  disconnect: () => void
  destroy: () => void
}

export const RadixDappToolkit = (
  options: RadixDappToolkitOptions
): RadixDappToolkit => {
  const {
    dAppDefinitionAddress,
    networkId,
    providers,
    logger,
    onDisconnect,
    explorer,
    gatewayBaseUrl,
    useCache = true,
  } = options || {}

  const storageKey = `rdt:${dAppDefinitionAddress}:${networkId}`
  const dAppDefinitionAddressSubject = new BehaviorSubject<string>(
    dAppDefinitionAddress
  )
  const subscriptions = new Subscription()

  const connectButtonClient =
    providers?.connectButton ??
    ConnectButtonClient({
      logger,
    })

  const gatewayClient =
    providers?.gatewayClient ??
    GatewayClient({
      logger,
      gatewayApi: GatewayApiClient({
        basePath:
          gatewayBaseUrl ?? RadixNetworkConfigById[networkId].gatewayUrl,
        dAppDefinitionAddress,
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

  const dataRequestClient =
    providers?.dataRequestClient ??
    DataRequestClient({
      stateClient,
      requestItemClient,
      walletClient,
      useCache,
      dataRequestStateClient,
    })

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
                  details?.metadata.items.find((item) => item.key === 'name')
                ).stringified
            )
            .map((dAppName) => {
              connectButtonClient.setDappName(dAppName ?? 'Unnamed dApp')
            })
        )
      )
      .subscribe()
  )

  subscriptions.add(
    walletClient.extensionStatus$
      .pipe(
        tap((result) => {
          connectButtonClient.setIsExtensionAvailable(
            result.isExtensionAvailable
          )
          connectButtonClient.setIsWalletLinked(result.isWalletLinked)
        })
      )

      .subscribe()
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
        })
      )
      .subscribe()
  )

  subscriptions.add(
    connectButtonClient.onLinkClick$
      .pipe(
        tap(({ type, data }) => {
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
        })
      )
      .subscribe()
  )

  subscriptions.add(
    connectButtonClient.onShowPopover$
      .pipe(
        withLatestFrom(walletClient.requestItems$),
        tap(([_, items]) => {
          if (items.filter((item) => item.status === 'pending').length > 0) {
            connectButtonClient.setActiveTab('requests')
          }
        })
      )
      .subscribe()
  )

  subscriptions.add(
    connectButtonClient.onDisconnect$
      .pipe(
        tap(() => {
          stateClient.reset()
          walletClient.resetRequestItems()
          if (onDisconnect) onDisconnect()
        })
      )
      .subscribe()
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
        })
      )
      .subscribe()
  )

  subscriptions.add(
    walletClient.requestItems$
      .pipe(tap((items) => connectButtonClient.setRequestItems(items)))
      .subscribe()
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
              newStatus === 'success' ? 'success' : 'error'
            )

            return timer(2000).pipe(
              withLatestFrom(walletClient.requestItems$),
              tap(([_, items]) => {
                const pendingItem = items.find(
                  (item) => item.status === 'pending'
                )
                connectButtonClient.setStatus(
                  pendingItem ? 'pending' : 'default'
                )
              })
            )
          }

          return of()
        })
      )
      .subscribe()
  )

  subscriptions.add(
    merge(connectButtonClient.onUpdateSharedData$)
      .pipe(switchMap(() => dataRequestClient.updateSharedData()))
      .subscribe()
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
      input: Parameters<typeof dataRequestClient.provideChallengeGenerator>[0]
    ) => dataRequestClient.provideChallengeGenerator(input),
    updateSharedData: () => dataRequestClient.updateSharedData(),
    sendOneTimeRequest: dataRequestClient.sendOneTimeRequest,
    sendTransaction: walletClient.sendTransaction,
    walletData$: stateClient.state$.pipe(map((state) => state.walletData)),
    getWalletData: () => stateClient.getState().walletData,
  }

  const buttonApi = {
    setTheme: connectButtonClient.setTheme,
    setMode: connectButtonClient.setMode,
  }

  const disconnect = () => {
    walletClient.resetRequestItems()
    stateClient.reset()
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
