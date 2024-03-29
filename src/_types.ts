import { Result, ResultAsync } from 'neverthrow'
import {
  WalletSdk,
  Account,
  AppLogger,
  PersonaDataName,
  Persona,
} from '@radixdlt/wallet-sdk'
import { Observable } from 'rxjs'
import { WalletClient } from './wallet/wallet-client'
import {
  RadixButtonStatus,
  RadixButtonTheme,
  RequestItem,
} from '@radixdlt/connect-button'
import { GatewayClient } from './gateway/gateway'
import { StateClient } from './state/state'
import { RequestItemClient } from './request-items/request-item-client'
import { DataRequestClient } from './data-request/data-request'
import { DataRequestStateClient } from './data-request/data-request-state'
import {
  State,
  Status,
  Transaction,
  TransactionStatus,
} from '@radixdlt/babylon-gateway-api-sdk'
import { SignedChallenge, WalletData } from './state/types'
import {
  DataRequestBuilderItem,
  OneTimeDataRequestBuilderItem,
} from './data-request/builders'

export type StorageProvider = {
  getData: <T = any>(key: string) => ResultAsync<T | undefined, Error>
  setData: (key: string, data: any) => ResultAsync<void, Error>
}

export type ConnectButtonProvider = {
  status$: Observable<RadixButtonStatus>
  onConnect$: Observable<{ challenge: string } | undefined>
  onDisconnect$: Observable<void>
  onUpdateSharedData$: Observable<void>
  onShowPopover$: Observable<void>
  onCancelRequestItem$: Observable<string>
  onLinkClick$: Observable<{
    type: 'account' | 'transaction' | 'showQrCode' | 'setupGuide'
    data: string
  }>
  setStatus: (value: RadixButtonStatus) => void
  setMode: (value: 'light' | 'dark') => void
  setTheme: (value: RadixButtonTheme) => void
  setActiveTab: (value: 'sharing' | 'requests') => void
  setIsMobile: (value: boolean) => void
  setIsWalletLinked: (value: boolean) => void
  setIsExtensionAvailable: (value: boolean) => void
  setConnected: (value: boolean) => void
  setLoggedInTimestamp: (value: string) => void
  setRequestItems: (value: RequestItem[]) => void
  setAccounts: (value: Account[]) => void
  setPersonaData: (value: { value: string; field: string }[]) => void
  setPersonaLabel: (value: string) => void
  setDappName: (value: string) => void
  destroy: () => void
  disconnect: () => void
}

export type Providers = {
  stateClient: StateClient
  connectButton: ConnectButtonProvider
  walletClient: WalletClient
  gatewayClient: GatewayClient
  walletSdk: WalletSdk
  requestItemClient: RequestItemClient
  storageClient: StorageProvider
  dataRequestClient: DataRequestClient
  dataRequestStateClient: DataRequestStateClient
}

export type ExplorerConfig = {
  baseUrl: string
  transactionPath: string
  accountsPath: string
}

type WalletDataRequest = Parameters<WalletSdk['request']>[0]

export type WalletRequest =
  | { type: 'sendTransaction'; payload: SendTransactionInput }
  | { type: 'dataRequest'; payload: WalletDataRequest }

export type RequestInterceptor = <T extends WalletRequest>(
  input: T
) => Promise<T['payload']>

export type OptionalRadixDappToolkitOptions = {
  logger: AppLogger
  onDisconnect: () => void
  explorer: ExplorerConfig
  gatewayBaseUrl: string
  applicationName: string
  applicationVersion: string
  useCache: boolean
  providers: Partial<Providers>
  requestInterceptor: RequestInterceptor
}

export type RadixDappToolkitOptions = {
  networkId: number
  dAppDefinitionAddress: string
} & Partial<OptionalRadixDappToolkitOptions>

export type SendTransactionResult = ResultAsync<
  {
    transactionIntentHash: string
    status: TransactionStatus
  },
  {
    error: string
    jsError?: unknown
    message?: string
    transactionIntentHash?: string
    status?: TransactionStatus
  }
>

export type SendTransactionInput = {
  transactionManifest: string
  version?: number
  blobs?: string[]
  message?: string
  onTransactionId?: (transactionId: string) => void
}

export type GatewayApi = {
  state: State
  status: Status
  transaction: Transaction
}

export type ButtonApi = {
  setMode: (value: 'light' | 'dark') => void
  setTheme: (value: RadixButtonTheme) => void
  status$: Observable<RadixButtonStatus>
}

export type WalletDataRequestError = {
  error: string
  message?: string
  jsError?: unknown
}

export type WalletDataRequestResult = ResultAsync<
  WalletData,
  WalletDataRequestError
>

export type AwaitedWalletDataRequestResult = Result<
  WalletData,
  WalletDataRequestError
>

export type WalletApi = {
  getWalletData: () => WalletDataState
  walletData$: Observable<WalletDataState>
  provideChallengeGenerator: (fn: () => Promise<string>) => void
  provideConnectResponseCallback: (
    fn: (result: AwaitedWalletDataRequestResult) => void
  ) => void
  dataRequestControl: (fn: (walletResponse: WalletData) => Promise<any>) => void
  updateSharedData: () => WalletDataRequestResult
  sendTransaction: (input: SendTransactionInput) => SendTransactionResult
  setRequestData: (...dataRequestBuilderItem: DataRequestBuilderItem[]) => void
  sendRequest: () => WalletDataRequestResult
  sendOneTimeRequest: (
    ...oneTimeDataRequestBuilderItem: OneTimeDataRequestBuilderItem[]
  ) => WalletDataRequestResult
}

export type WalletDataStateAccount = {
  address: string
  label: string
  appearanceId: number
}

export type WalletDataStatePersonaData =
  | {
      entry: 'fullName'
      fields: PersonaDataName
    }
  | { entry: 'emailAddresses'; fields: string[] }
  | { entry: 'phoneNumbers'; fields: string[] }

export type WalletDataState = {
  accounts: WalletDataStateAccount[]
  personaData: WalletDataStatePersonaData[]
  proofs: SignedChallenge[]
  persona?: Persona
}

export type RequestInterceptorFactoryOutput = ReturnType<
  typeof requestInterceptorFactory
>
export const requestInterceptorFactory =
  (requestInterceptor: RequestInterceptor) =>
  <T extends WalletRequest>(walletRequest: T) =>
    ResultAsync.fromPromise(
      requestInterceptor<T>(walletRequest),
      (jsError) => ({
        error: 'requestInterceptorError',
        jsError,
      })
    )
