import { ResultAsync } from 'neverthrow'
import { WalletSdk, Account, PersonaData } from '@radixdlt/wallet-sdk'
import { SdkError } from '@radixdlt/wallet-sdk/dist/helpers/error'
import { Observable } from 'rxjs'
import { WalletClient } from './wallet/wallet-client'
import { RequestItem } from '@radixdlt/connect-button'
import { GatewayClient } from './gateway/gateway'
import {
  ConnectButtonDataRequestInput,
  DataRequestInput,
  RdtStateWalletData,
} from './io/schemas'
import { StateClient } from './state/state'
import { RequestItemClient } from './request-items/request-item-client'

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

export type Providers = {
  stateClient: StateClient
  connectButton: ConnectButtonProvider
  walletClient: WalletClient
  gatewayClient: GatewayClient
  walletSdk: WalletSdk
  requestItemClient: RequestItemClient
  storageClient: StorageProvider
}

export type RequestData = (
  value: DataRequestInput,
  done?: () => void
) => ResultAsync<RdtStateWalletData, SdkError>

export type OnConnect = (
  value: (
    value: ConnectButtonDataRequestInput
  ) => ResultAsync<RdtStateWalletData, SdkError>
) => void | boolean | Promise<void | boolean>
