import { ResultAsync } from 'neverthrow'
import { WalletSdk, Account } from '@radixdlt/wallet-sdk'
import { Observable } from 'rxjs'
import { WalletClient } from './wallet/wallet-client'
import { RequestItem } from '@radixdlt/connect-button'
import { GatewayClient } from './gateway/gateway'
import { StateClient } from './state/state'
import { RequestItemClient } from './request-items/request-item-client'
import { DataRequestClient } from './data-request/data-request'

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
}
