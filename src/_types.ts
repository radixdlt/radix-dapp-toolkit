import { Result, ResultAsync } from 'neverthrow'
import { WalletSdk as WalletSdkType } from '@radixdlt/wallet-sdk'
import { Account } from '@radixdlt/wallet-sdk/dist/IO/schemas'
import { SdkError } from '@radixdlt/wallet-sdk/dist/helpers/error'
import { Observable } from 'rxjs'
import { WalletClient } from './wallet/wallet-client'
import { OngoingAccounts } from '@radixdlt/wallet-sdk/dist/IO/request-items/ongoing-accounts'

export type StorageProvider = {
  getData: <T = any>(key: string) => ResultAsync<T | undefined, Error>
  setData: (key: string, data: any) => ResultAsync<void, Error>
}

export type ConnectButtonProvider = {
  onConnect$: Observable<{ challenge: string } | undefined>
  onDisconnect$: Observable<void>
  setLoading: (value: boolean) => void
  setConnected: (value: boolean) => void
  destroy: () => void
}

export type DataRequestValue = Parameters<WalletSdkType['request']>[0]
export type SendTransactionRequestValue = Parameters<
  WalletSdkType['sendTransaction']
>[0]

export type WalletDataRequest = {
  type: 'data'
  value: DataRequestValue
}

export type WalletSendTransactionRequest = {
  type: 'sendTransaction'
  value: SendTransactionRequestValue
}

export type WalletRequest = WalletDataRequest | WalletSendTransactionRequest

export type State = {
  connected: boolean
  accounts?: Account[]
  persona?: { identityAddress: string; label: string }
}

export type RequestStatus = keyof typeof RequestStatus

export const RequestStatus = {
  pending: 'pending',
  success: 'success',
  fail: 'fail',
} as const

export type RequestItem = WalletRequest & { status: RequestStatus }

export type DataRequestInput = {
  accounts?: OngoingAccounts['WithoutProofOfOwnership']['method']['input']
}

export type Persona = { identityAddress: string; label: string }

export type RequestDataResponse = Result<
  {
    accounts: Account[]
    persona: Persona
  },
  SdkError
>

export type Connect = {
  onConnect: (done: (input?: { challenge: string }) => void) => void
  onResponse: (result: RequestDataResponse, done: () => void) => void
  requestData: DataRequestInput
}

export type OnConnectCallback = (
  result: RequestDataResponse,
  done: () => void
) => void

export type OnInitCallback = (state: State) => void

export type Providers = {
  storage: StorageProvider
  connectButton: ConnectButtonProvider
  walletClient: WalletClient
}

export type RequestDataOutput = ResultAsync<
  {
    done?: () => void
    data: {
      accounts: {
        address: string
        label: string
        appearanceId: number
      }[]
      persona: {
        label: string
        identityAddress: string
      }
    }
  },
  SdkError
>

export type RequestData = (value: DataRequestInput) => RequestDataOutput
