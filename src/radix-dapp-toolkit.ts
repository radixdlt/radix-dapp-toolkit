import { Providers } from './_types'
import { StateClient } from './state/state'
import { ConnectButtonClient } from './connect-button/connect-button-client'
import { WalletClient } from './wallet/wallet-client'
import { AppLogger, WalletSdk } from '@radixdlt/wallet-sdk'
import { GatewayApiClient } from './gateway/gateway-api'
import { getGatewayBaseUrlByNetworkId } from './gateway/helpers/get-gateway-url'
import { GatewayClient, MetadataValue } from './gateway/gateway'
import {
  BehaviorSubject,
  Subscription,
  filter,
  merge,
  switchMap,
  tap,
} from 'rxjs'

import { RequestItemClient } from './request-items/request-item-client'
import { LocalStorageClient } from './storage/local-storage-client'
import { DataRequestClient } from './data-request/data-request'
import { transformWalletDataToConnectButton } from './data-request/transformations/wallet-data-to-connect-button'
import { DataRequestStateClient } from './data-request/data-request-state'
import { RadixNetworkConfigById } from '@radixdlt/babylon-gateway-api-sdk'

export type RadixDappToolkitOptions = {
  networkId: number
  dAppDefinitionAddress: string
  logger?: AppLogger
  onDisconnect?: () => void
  explorer?: {
    baseUrl: string
    transactionPath: string
    accountsPath: string
  }
  gatewayBaseUrl?: string
  useCache?: boolean
  providers?: Partial<Providers>
}

export type RadixDappToolkit = ReturnType<typeof RadixDappToolkit>

export const RadixDappToolkit = (options: RadixDappToolkitOptions) => {
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
      explorer: explorer ?? {
        baseUrl: RadixNetworkConfigById[networkId].dashboardUrl,
        transactionPath: '/transaction/',
        accountsPath: '/account/',
      },
    })

  const gatewayClient =
    providers?.gatewayClient ??
    GatewayClient({
      logger,
      gatewayApi: GatewayApiClient({
        basePath: gatewayBaseUrl ?? getGatewayBaseUrlByNetworkId(networkId),
        dAppDefinitionAddress,
      }),
    })

  const walletSdk =
    providers?.walletSdk ??
    WalletSdk({
      networkId,
      dAppDefinitionAddress,
      logger,
    })

  const requestItemClient =
    providers?.requestItemClient ??
    RequestItemClient({
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

  const storageClient = providers?.storageClient ?? LocalStorageClient()

  const stateClient =
    providers?.stateClient ??
    StateClient(storageKey, storageClient, {
      logger,
    })

  const dataRequestStateClient =
    providers?.dataRequestStateClient ??
    DataRequestStateClient({
      accounts: {
        numberOfAccounts: { quantifier: 'atLeast', quantity: 1 },
        reset: false,
        withProof: false,
      },
    })

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
      .pipe(
        tap((items) => {
          connectButtonClient.setRequestItems(items)
          connectButtonClient.setConnecting(
            items.some(
              (item) =>
                item.status === 'pending' && item.type === 'loginRequest'
            )
          )
          connectButtonClient.setLoading(
            items.some((item) => item.status === 'pending')
          )
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
  const walletDataApi = {
    setRequestData: dataRequestClient.setState,
    sendRequest: () =>
      dataRequestClient.sendRequest({
        isConnect: false,
        oneTime: false,
      }),
    provideChallengeGenerator: (
      input: Parameters<typeof dataRequestClient.provideChallengeGenerator>[0]
    ) => {
      dataRequestClient.provideChallengeGenerator(input)
      return { setRequestData: dataRequestClient.setState }
    },
    updateSharedData: () => dataRequestClient.updateSharedData(),
    oneTimeRequest: dataRequestClient.sendOneTimeRequest,
  }

  return {
    walletData: walletDataApi,
    sendTransaction: walletClient.sendTransaction,
    gatewayApi,
    state$: stateClient.state$,
    getState: stateClient.getState,
    disconnect: () => {
      walletClient.resetRequestItems()
      stateClient.reset()
    },
    destroy: () => {
      stateClient.destroy()
      walletClient.destroy()
      subscriptions.unsubscribe()
      connectButtonClient.destroy()
    },
  }
}
