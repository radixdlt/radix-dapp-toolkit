import {
  DappMetadata,
  Explorer,
  OnConnect,
  OnDisconnectCallback,
  OnInitCallback,
  Providers,
  State,
} from './_types'
import { Logger } from 'tslog'
import { StateClient } from './state/state'
import { ConnectButtonClient } from './connect-button/connect-button-client'
import { WalletClient } from './wallet/wallet-client'
import { LocalStorageClient } from './storage/local-storage-client'
import { WalletSdk } from '@radixdlt/wallet-sdk'
import { GatewayApiClient } from './gateway/gateway-api'
import { getGatewayBaseUrlByNetworkId } from './gateway/helpers/get-gateway-url'
import { GatewayClient } from './gateway/gateway'
import { Subscription, tap } from 'rxjs'
import { createGetState } from './state/helpers/get-state'
import { StateSubjects } from './state/subjects'

export type RadixDappToolkitConfiguration = {
  initialState?: State
  logger?: Logger<unknown>
  networkId?: number
  onInit?: OnInitCallback
  onDisconnect?: OnDisconnectCallback
  onReset?: OnConnect
  providers?: Partial<Providers>
  useDoneCallback?: boolean
  explorer?: Explorer
  gatewayBaseUrl?: string
  onStateChange?: (state: State) => void
  useCache?: boolean
}
export const RadixDappToolkit = (
  { dAppDefinitionAddress, dAppName }: DappMetadata,
  onConnect?: OnConnect,
  configuration?: RadixDappToolkitConfiguration
) => {
  const {
    networkId = 0x01,
    providers,
    logger,
    initialState,
    onInit: onInitCallback = () => {},
    onDisconnect: onDisconnectCallback = () => {},
    explorer,
    gatewayBaseUrl,
    useCache,
  } = configuration || {}
  const storageClient = providers?.storage || LocalStorageClient()

  const subscriptions = new Subscription()

  const connectButtonClient =
    providers?.connectButton ||
    ConnectButtonClient({ logger, dAppName, explorer })

  const gatewayClient =
    providers?.gatewayClient ||
    GatewayClient({
      logger,
      gatewayApi: GatewayApiClient(
        gatewayBaseUrl ?? getGatewayBaseUrlByNetworkId(networkId)
      ),
    })

  const stateSubjects = StateSubjects()

  const getState = createGetState(stateSubjects.state$)

  const walletClient =
    providers?.walletClient ||
    WalletClient({
      logger,
      walletSdk: WalletSdk({
        networkId,
        dAppDefinitionAddress,
        logLevel: 'debug',
      }),
      gatewayClient,
      getState,
    })

  const stateClient = StateClient({
    connectButtonClient,
    initialState,
    key: `rdt:${dAppDefinitionAddress}:${networkId}`,
    logger,
    onInitCallback,
    onDisconnectCallback,
    storageClient,
    walletClient,
    connectRequest: onConnect,
    useDoneCallback: configuration?.useDoneCallback,
    subjects: stateSubjects,
    getState,
    useCache,
  })

  if (configuration?.onStateChange)
    subscriptions.add(
      stateClient.state$.pipe(tap(configuration.onStateChange)).subscribe()
    )

  return {
    requestData: stateClient.requestData,
    sendTransaction: walletClient.sendTransaction,
    state$: stateClient.state$,
    updateSharedData: () => stateClient.subjects.updateSharedData.next(),
    disconnect: stateClient.reset,
    destroy: () => {
      stateClient.destroy()
      subscriptions.unsubscribe()
    },
  }
}
