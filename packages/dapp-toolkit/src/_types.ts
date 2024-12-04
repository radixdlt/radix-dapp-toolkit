import type { Result, ResultAsync } from 'neverthrow'
import type { Observable } from 'rxjs'

import type { RadixButtonStatus, RadixButtonTheme } from 'radix-connect-common'
import {
  CallbackFns,
  Persona,
  PersonaDataName,
  WalletInteraction,
} from './schemas'
import type { Logger } from './helpers'
import type { SdkError } from './error'
import type {
  StorageModule,
  TransactionStatus,
  WalletRequestSdk,
  Session,
  WalletData,
  SignedChallenge,
  StateModule,
  DataRequestBuilderItem,
  OneTimeDataRequestBuilderItem,
  GatewayModule,
  WalletRequestModule,
  ConnectButtonModule,
} from './modules'
import { BuildableSubintentRequest } from './modules/wallet-request/pre-authorization-request/subintent-builder'

export type Providers = {
  connectButtonModule: ConnectButtonModule
  gatewayModule: GatewayModule
  stateModule: StateModule
  storageModule: StorageModule
  walletRequestModule: WalletRequestModule
}

export type ExplorerConfig = {
  baseUrl: string
  transactionPath: string
  subintentPath: string
  accountsPath: string
}

export type WalletDataRequest = Parameters<
  WalletRequestSdk['sendInteraction']
>[0]

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
  featureFlags: string[]
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

export type SendPreAuthorizationRequestInput = BuildableSubintentRequest

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
  updateSharedAccounts: () => WalletDataRequestResult
  sendTransaction: (input: SendTransactionInput) => SendTransactionResult
  sendPreAuthorizationRequest: (
    input: SendPreAuthorizationRequestInput,
  ) => ResultAsync<{ signedPartialTransaction: string }, SdkError>
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
  id: string
  isLinked$?: Observable<boolean>
  isAvailable$?: Observable<boolean>
  sessionChange$?: Observable<Session>
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
