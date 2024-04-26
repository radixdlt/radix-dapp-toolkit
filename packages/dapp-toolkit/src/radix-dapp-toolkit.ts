import { ConnectButtonClient } from './connect-button/connect-button-client'
import {
  ButtonApi,
  GatewayApiClientConfig,
  RadixDappToolkitOptions,
  SendTransactionInput,
  WalletApi,
} from './_types'
import { LocalStorageClient } from './storage'
import { GatewayClient } from './gateway/gateway'
import { GatewayApiClient } from './gateway/gateway-api'
import { WalletRequestClient } from './wallet-request'
import { StateClient, WalletData } from './state'
import { generateGatewayApiClientConfig } from './helpers/generate-gateway-api-config'

export type RadixDappToolkit = {
  walletApi: WalletApi
  buttonApi: ButtonApi
  gatewayApi: {
    clientConfig: GatewayApiClientConfig
  }
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
    gatewayBaseUrl,
    applicationName,
    applicationVersion,
    useCache = true,
    enableMobile = false,
  } = options || {}

  const storageClient =
    providers?.storageClient ??
    LocalStorageClient(`rdt:${dAppDefinitionAddress}:${networkId}`)

  const stateClient =
    providers?.stateClient ??
    StateClient({
      logger,
      providers: {
        storageClient: storageClient.getPartition('state'),
      },
    })

  const gatewayApiClientConfig = generateGatewayApiClientConfig({
    networkId,
    dAppDefinitionAddress,
    gatewayBaseUrl,
    applicationName,
    applicationVersion,
  })

  const gatewayClient =
    providers?.gatewayClient ??
    GatewayClient({
      logger,
      gatewayApi: GatewayApiClient(gatewayApiClientConfig),
    })

  const walletRequestClient =
    providers?.walletRequestClient ??
    WalletRequestClient({
      logger,
      useCache,
      networkId,
      dAppDefinitionAddress,
      requestInterceptor: options.requestInterceptor,
      providers: {
        stateClient,
        storageClient,
        gatewayClient,
        transports: options.providers?.transports,
        requestItemClient: options.providers?.requestItemClient,
      },
    })

  const connectButtonClient =
    providers?.connectButton ??
    ConnectButtonClient({
      logger,
      networkId,
      explorer: options.explorer,
      enableMobile,
      onDisconnect,
      dAppDefinitionAddress,
      providers: {
        stateClient,
        walletRequestClient,
        gatewayClient,
        storageClient: options.providers?.storageClient,
      },
    })

  return {
    walletApi: {
      setRequestData: walletRequestClient.setRequestDataState,
      sendRequest: () =>
        walletRequestClient.sendRequest({
          isConnect: false,
          oneTime: false,
        }),

      provideChallengeGenerator: (fn: () => Promise<string>) =>
        walletRequestClient.provideChallengeGenerator(fn),
      dataRequestControl: (fn: (walletData: WalletData) => Promise<any>) => {
        walletRequestClient.provideDataRequestControl(fn)
      },
      provideConnectResponseCallback:
        walletRequestClient.provideConnectResponseCallback,
      updateSharedData: () => walletRequestClient.updateSharedData(),
      sendOneTimeRequest: walletRequestClient.sendOneTimeRequest,
      sendTransaction: (input: SendTransactionInput) =>
        walletRequestClient.sendTransaction(input),
      walletData$: stateClient.walletData$,
      getWalletData: stateClient.getWalletData,
    } satisfies WalletApi,
    buttonApi: {
      setTheme: connectButtonClient.setTheme,
      setMode: connectButtonClient.setMode,
      status$: connectButtonClient.status$,
    },
    gatewayApi: {
      clientConfig: gatewayApiClientConfig,
    },
    disconnect: () => {
      walletRequestClient.disconnect()
      connectButtonClient.disconnect()
      if (onDisconnect) onDisconnect()
    },
    destroy: () => {
      stateClient.destroy()
      walletRequestClient.destroy()
      connectButtonClient.destroy()
    },
  }
}
