import type {
  ButtonApi,
  GatewayApiClientConfig,
  RadixDappToolkitOptions,
  SendTransactionInput,
  WalletApi,
} from './_types'
import {
  type WalletData,
  LocalStorageModule,
  WalletRequestModule,
  StateModule,
  GatewayModule,
  ConnectButtonModule,
  generateGatewayApiConfig,
} from './modules'

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
    featureFlags = [],
  } = options || {}

  const enableExperimentalMobileSupport = featureFlags.includes(
    'ExperimentalMobileSupport',
  )

  const storageModule =
    providers?.storageModule ??
    LocalStorageModule(`rdt:${dAppDefinitionAddress}:${networkId}`)

  const stateModule =
    providers?.stateModule ??
    StateModule({
      logger,
      providers: {
        storageModule: storageModule.getPartition('state'),
      },
    })

  const gatewayModule =
    providers?.gatewayModule ??
    GatewayModule({
      logger,
      clientConfig: generateGatewayApiConfig({
        networkId,
        dAppDefinitionAddress,
        gatewayBaseUrl,
        applicationName,
        applicationVersion,
      }),
    })

  const walletRequestModule =
    providers?.walletRequestModule ??
    WalletRequestModule({
      logger,
      useCache,
      networkId,
      dAppDefinitionAddress,
      requestInterceptor: options.requestInterceptor,
      enableMobile: enableExperimentalMobileSupport,
      providers: {
        stateModule,
        storageModule,
        gatewayModule,
        dataRequestStateModule: providers?.dataRequestStateModule,
      },
    })

  const connectButtonModule =
    providers?.connectButtonModule ??
    ConnectButtonModule({
      logger,
      networkId,
      explorer: options.explorer,
      enableMobile: enableExperimentalMobileSupport,
      onDisconnect,
      dAppDefinitionAddress,
      providers: {
        stateModule,
        walletRequestModule,
        gatewayModule,
        storageModule: storageModule.getPartition('connectButton'),
      },
    })

  return {
    walletApi: {
      setRequestData: walletRequestModule.setRequestDataState,
      sendRequest: () =>
        walletRequestModule.sendRequest({
          isConnect: false,
          oneTime: false,
        }),
      provideChallengeGenerator: (fn: () => Promise<string>) =>
        walletRequestModule.provideChallengeGenerator(fn),
      dataRequestControl: (fn: (walletData: WalletData) => Promise<any>) => {
        walletRequestModule.provideDataRequestControl(fn)
      },
      provideConnectResponseCallback:
        walletRequestModule.provideConnectResponseCallback,
      updateSharedData: () => walletRequestModule.updateSharedData(),
      sendOneTimeRequest: walletRequestModule.sendOneTimeRequest,
      sendTransaction: (input: SendTransactionInput) =>
        walletRequestModule.sendTransaction(input),
      walletData$: stateModule.walletData$,
      getWalletData: stateModule.getWalletData,
    } satisfies WalletApi,
    buttonApi: {
      setTheme: connectButtonModule.setTheme,
      setMode: connectButtonModule.setMode,
      status$: connectButtonModule.status$,
    },
    gatewayApi: {
      clientConfig: gatewayModule.configuration,
    },
    disconnect: () => {
      walletRequestModule.disconnect()
      connectButtonModule.disconnect()
      if (onDisconnect) onDisconnect()
    },
    destroy: () => {
      stateModule.destroy()
      walletRequestModule.destroy()
      connectButtonModule.destroy()
    },
  }
}
