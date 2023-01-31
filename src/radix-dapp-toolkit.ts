import { OnInitCallback, Providers, RequestData, State } from './_types'
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
  providers?: Partial<Providers>
  useDoneCallback?: boolean
}
export const RadixDappToolkit = (
  dAppDefinitionAddress: string,
  connectRequest?: (connectRequest: RequestData) => any,
  configuration?: RadixDappToolkitConfiguration
) => {
  const {
    networkId = 0x01,
    providers,
    logger,
    initialState,
    onInit: onInitCallback = () => {},
  } = configuration || {}
  const storageClient = providers?.storage || LocalStorageClient()

  const connectButtonClient =
    providers?.connectButton || ConnectButtonClient({ logger })

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
    storageClient,
    walletClient,
    connectRequest,
    useDoneCallback: configuration?.useDoneCallback,
  })

  return {
    requestData: stateClient.requestData,
    sendTransaction: walletClient.sendTransaction,
    destroy: () => {
      stateClient.destroy()
    },
  }
}
