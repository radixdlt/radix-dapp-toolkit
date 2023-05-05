import { ResultAsync } from 'neverthrow'
import {
  WalletSdk,
  Account,
  NumberOfAccounts,
  Persona,
  PersonaDataField,
  PersonaData,
  AuthLoginWithChallengeRequestResponseItem,
} from '@radixdlt/wallet-sdk'
import { SdkError } from '@radixdlt/wallet-sdk/dist/helpers/error'
import { Observable } from 'rxjs'
import { WalletClient } from './wallet/wallet-client'
import { RequestItem } from '@radixdlt/connect-button'
import { GatewayClient } from './gateway/gateway'

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
  setPersonaData: (value: PersonaData[]) => void
  setPersonaLabel: (value: string) => void
  setConnecting: (value: boolean) => void
  destroy: () => void
}

export type DataRequestValue = Parameters<WalletSdk['request']>[0]
export type SendTransactionRequestValue = Parameters<
  WalletSdk['sendTransaction']
>[0]

export type State = {
  connected: boolean
  accounts?: Account[]
  personaData?: PersonaData[]
  persona?: Persona
  sharedData: Partial<{
    ongoingAccountsWithoutProofOfOwnership: DataRequestValue['ongoingAccountsWithoutProofOfOwnership']
    ongoingPersonaData: DataRequestValue['ongoingPersonaData']
  }>
}

type OneTimeRequest = { oneTime?: boolean; reset?: boolean }

export type DataRequestInput<IsLoginRequest extends boolean = false> =
  IsLoginRequest extends true
    ? {
        accounts?: NumberOfAccounts
        personaData?: { fields: PersonaDataField[] }
        challenge?: string
      }
    : {
        accounts?: NumberOfAccounts & OneTimeRequest
        personaData?: { fields: PersonaDataField[] } & OneTimeRequest
        challenge?: string
      }

export type Connect = {
  onConnect: (done: (input?: { challenge: string }) => void) => void
  onResponse: (
    result: ResultAsync<RequestDataOutput, SdkError>,
    done: () => void
  ) => void
  requestData: DataRequestInput<true>
}

export type OnConnectCallback = (
  result: ResultAsync<RequestDataOutput, SdkError>,
  done: () => void
) => void

export type OnInitCallback = (state: State) => void

export type OnDisconnectCallback = () => void

export type OnResetCallback = (
  value: (
    value: DataRequestInput<true>
  ) => ResultAsync<RequestDataOutput, SdkError>
) => any

export type Providers = {
  storage: StorageProvider
  connectButton: ConnectButtonProvider
  walletClient: WalletClient
  gatewayClient: GatewayClient
}

export type RequestDataOutput = {
  done?: () => void
  data: {
    accounts: Account[]
    personaData: PersonaData[]
    persona?: Persona
    challenge?: string
    proof?: AuthLoginWithChallengeRequestResponseItem['proof']
  }
}

export type RequestData = (
  value: DataRequestInput
) => ResultAsync<RequestDataOutput, SdkError>

export type DappMetadata = {
  dAppDefinitionAddress: string
  dAppName: string
}

export type OnConnect = (
  value: (
    value: DataRequestInput<true>
  ) => ResultAsync<RequestDataOutput, SdkError>
) => any

export type Explorer = {
  baseUrl: string
  transactionPath: string
  accountsPath: string
}
