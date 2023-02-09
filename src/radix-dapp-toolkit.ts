import {
  OnDisconnectCallback,
  OnInitCallback,
  Providers,
  RequestData,
  State,
} from './_types'
import { Logger } from 'tslog'
import { StateClient } from './state/state'
import { ConnectButtonClient } from './connect-button/connect-button-client'
import { WalletClient } from './wallet/wallet-client'
import { LocalStorageClient } from './storage/local-storage-client'
import WalletSdk from '@radixdlt/wallet-sdk'

export type RadixDappToolkitConfiguration = {
  initialState?: State
  logger?: Logger<unknown>
  networkId?: number
  onInit?: OnInitCallback
  onDisconnect?: OnDisconnectCallback
  providers?: Partial<Providers>
  useDoneCallback?: boolean
  explorer?: {
    baseUrl: string
    transactionPath: string
    accountsPath: string
  }
}
export const RadixDappToolkit = (
  {
    dAppDefinitionAddress,
    dAppName,
  }: { dAppDefinitionAddress: string; dAppName: string },
  connectRequest?: (connectRequest: RequestData) => any,
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
  } = configuration || {}
  const storageClient = providers?.storage || LocalStorageClient()

  const connectButtonClient =
    providers?.connectButton ||
    ConnectButtonClient({ logger, dAppName, explorer })

  const walletClient =
    providers?.walletClient ||
    WalletClient({
      logger,
      walletSdk: WalletSdk({
        networkId,
        dAppDefinitionAddress,
        logLevel: 'debug',
      }),
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
    connectRequest,
    useDoneCallback: configuration?.useDoneCallback,
  })

  return {
    requestData: stateClient.requestData,
    sendTransaction: walletClient.sendTransaction,
    state$: stateClient.state$,
    destroy: () => {
      stateClient.destroy()
    },
  }
}
