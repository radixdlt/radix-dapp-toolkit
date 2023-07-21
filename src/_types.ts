import { ResultAsync } from 'neverthrow'
import {
  WalletSdk,
  Account,
  AppLogger,
  PersonaDataName,
  Persona,
} from '@radixdlt/wallet-sdk'
import { Observable } from 'rxjs'
import { WalletClient } from './wallet/wallet-client'
import { RequestItem } from '@radixdlt/connect-button'
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
  onConnect$: Observable<{ challenge: string } | undefined>
  onDisconnect$: Observable<void>
  onUpdateSharedData$: Observable<void>
  onCancelRequestItem$: Observable<string>
  setLoading: (value: boolean) => void
  setConnected: (value: boolean) => void
  setRequestItems: (value: RequestItem[]) => void
  setAccounts: (value: Account[]) => void
  setPersonaData: (value: { value: string; field: string }[]) => void
  setPersonaLabel: (value: string) => void
  setDappName: (value: string) => void
  setConnecting: (value: boolean) => void
  destroy: () => void
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

export type OptionalRadixDappToolkitOptions = {
  logger: AppLogger
  onDisconnect: () => void
  explorer: ExplorerConfig
  gatewayBaseUrl: string
  useCache: boolean
  providers: Partial<Providers>
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
  { error: string; message?: string }
>

export type SendTransactionInput = {
  transactionManifest: string
  version: number
  blobs?: string[] | undefined
  message?: string | undefined
}

export type GatewayApi = {
  state: State
  status: Status
  transaction: Transaction
}

export type WalletDataRequestResult = ResultAsync<
  WalletData,
  { error: string; message?: string }
>

export type WalletApi = {
  getWalletData: () => WalletDataState
  walletData$: Observable<WalletDataState>
  provideChallengeGenerator: (fn: () => Promise<string>) => void
  sendRequest: () => WalletDataRequestResult
  updateSharedData: () => WalletDataRequestResult
  sendTransaction: (input: SendTransactionInput) => SendTransactionResult
  setRequestData: (...dataRequestBuilderItem: DataRequestBuilderItem[]) => void
  oneTimeRequest: (
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
