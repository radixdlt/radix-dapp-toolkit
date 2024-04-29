import type { Result } from 'neverthrow'
import { ResultAsync } from 'neverthrow'
import type { Observable } from 'rxjs'
import type { WalletRequestClient } from './wallet-request/wallet-request'
import type {
  RadixButtonStatus,
  RadixButtonTheme,
  RequestItem,
} from 'radix-connect-common'
import type { GatewayClient } from './gateway/gateway'
import type { RequestItemClient } from './wallet-request/request-items/request-item-client'
import type { DataRequestStateClient } from './wallet-request/data-request/data-request-state'
import type {
  DataRequestBuilderItem,
  OneTimeDataRequestBuilderItem,
} from './wallet-request/data-request/builders'
import {
  Account,
  CallbackFns,
  Persona,
  PersonaDataName,
  WalletInteraction,
} from './schemas'
import { StateClient } from './state/state'
import { WalletData, SignedChallenge } from './state/types'
import type { Logger } from './helpers'
import { SdkError } from './error'
import { WalletRequestSdk } from './wallet-request'
import { TransactionStatus } from './gateway/types'
import { StorageProvider } from './storage/local-storage-client'

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
  walletRequestClient: WalletRequestClient
  gatewayClient: GatewayClient
  walletRequestSdk: WalletRequestSdk
  requestItemClient: RequestItemClient
  storageClient: StorageProvider
  dataRequestStateClient: DataRequestStateClient
  transports: TransportProvider[]
}

export type ExplorerConfig = {
  baseUrl: string
  transactionPath: string
  accountsPath: string
}

export type WalletDataRequest = Parameters<WalletRequestSdk['request']>[0]

export type WalletRequest =
  | { type: 'sendTransaction'; payload: WalletInteraction }
  | { type: 'dataRequest'; payload: WalletInteraction }

export type OptionalRadixDappToolkitOptions = {
  logger: Logger
  onDisconnect: () => void
  explorer: ExplorerConfig
  gatewayBaseUrl: string
  applicationName: string
  applicationVersion: string
  useCache: boolean
  providers: Partial<Providers>
  requestInterceptor: (input: WalletInteraction) => Promise<WalletInteraction>
  enableMobile: boolean
}

type RequiredRadixDappToolkitOptions = {
  networkId: number
} & (
  | {
      dAppDefinitionAddress: string
      applicationDappDefinitionAddress?: never
    }
  | {
      dAppDefinitionAddress?: never
      applicationDappDefinitionAddress: string
    }
)

export type RadixDappToolkitOptions = Partial<OptionalRadixDappToolkitOptions> &
  RequiredRadixDappToolkitOptions

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
  getWalletData: () => WalletDataState | undefined
  walletData$: Observable<WalletDataState>
  provideChallengeGenerator: (fn: () => Promise<string>) => void
  provideConnectResponseCallback: (
    fn: (result: AwaitedWalletDataRequestResult) => void,
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

export type TransportProvider = {
  isLinked$?: Observable<boolean>
  isAvailable$?: Observable<boolean>
  showQrCode?: () => void
  isSupported: () => boolean
  send: (
    walletInteraction: WalletInteraction,
    callbackFns: Partial<CallbackFns>,
  ) => ResultAsync<unknown, SdkError>
  disconnect: () => void
  destroy: () => void
}

export type GatewayApiClientConfig = {
  basePath: string
  applicationName: string
  applicationVersion: string
  applicationDappDefinitionAddress: string
}
