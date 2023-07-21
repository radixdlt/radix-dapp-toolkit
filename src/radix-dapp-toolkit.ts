import { StateClient } from './state/state'
import { ConnectButtonClient } from './connect-button/connect-button-client'
import { WalletClient } from './wallet/wallet-client'
import { WalletSdk } from '@radixdlt/wallet-sdk'
import { GatewayApiClient } from './gateway/gateway-api'
import { getGatewayBaseUrlByNetworkId } from './gateway/helpers/get-gateway-url'
import { GatewayClient } from './gateway/gateway'
import { BehaviorSubject, Subscription, map, merge, switchMap, tap } from 'rxjs'

import { RequestItemClient } from './request-items/request-item-client'
import { LocalStorageClient } from './storage/local-storage-client'
import { DataRequestClient } from './data-request/data-request'
import { transformWalletDataToConnectButton } from './data-request/transformations/wallet-data-to-connect-button'
import { DataRequestStateClient } from './data-request/data-request-state'
import { GatewayApi, RadixDappToolkitOptions, WalletApi } from './_types'

export type RadixDappToolkit = {
  walletApi: WalletApi
  gatewayApi: GatewayApi
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
    providers?.connectButton ?? ConnectButtonClient({ logger, explorer })

  const gatewayClient =
    providers?.gatewayClient ??
    GatewayClient({
      logger,
      gatewayApi: GatewayApiClient(
        gatewayBaseUrl ?? getGatewayBaseUrlByNetworkId(networkId)
      ),
    })

  const walletSdk =
    providers?.walletSdk ??
    WalletSdk({
      logger,
      networkId,
      dAppDefinitionAddress,
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
        switchMap((address) =>
          gatewayClient.gatewayApi
            .getEntityDetails(address)
            .map(
              (details) =>
                details?.metadata.items.find((item) => item.key === 'name')
                  ?.value?.as_string
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
    disconnect,
    destroy,
  }
}
