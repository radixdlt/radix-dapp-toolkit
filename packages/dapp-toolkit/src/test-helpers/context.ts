import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended'
import { StateClient } from '../state/state'
import { ConnectButtonClient } from '../connect-button/connect-button-client'
import { WalletRequestClient } from '../wallet-request/wallet-request'
import { GatewayClient } from '../gateway/gateway'
import { GatewayApiClient } from '../gateway/gateway-api'
import { RequestItemClient } from '../request-items/request-item-client'
import { StorageProvider } from '../_types'
import { ConnectButtonSubjects } from '../connect-button/subjects'
import { StateSubjects } from '../state/subjects'
import { RequestItemSubjects } from '../request-items/subjects'
import { okAsync } from 'neverthrow'
import { InMemoryClient } from '../storage/in-memory-storage-client'
import { of } from 'rxjs'
import { WalletRequestSdk } from '../wallet-request'

export type Context = {
  stateClient: StateClient
  connectButton: ConnectButtonClient
  walletRequestClient: WalletRequestClient
  gatewayClient: GatewayClient
  gatewayApiClient: GatewayApiClient
  walletRequestSdk: WalletRequestSdk
  requestItemClient: RequestItemClient
  storageClient: StorageProvider
}

export type MockContext = {
  requestItemSubjects: RequestItemSubjects
  connectButtonSubjects: ConnectButtonSubjects
  stateSubjects: StateSubjects
  stateClient: StateClient
  walletRequestClient: WalletRequestClient
  requestItemClient: RequestItemClient
  storageClient: StorageProvider
  gatewayClient: GatewayClient
  gatewayApiClient: DeepMockProxy<GatewayApiClient>
  walletRequestSdk: DeepMockProxy<WalletRequestSdk>
  connectButton: DeepMockProxy<ConnectButtonClient>
}

export const createMockContext = (): MockContext => {
  const stateSubjects = StateSubjects()
  const connectButtonSubjects = ConnectButtonSubjects()
  const requestItemSubjects = RequestItemSubjects()

  const gatewayApiClientMock = mockDeep<GatewayApiClient>()
  const connectButtonMock = mockDeep<ConnectButtonClient>()
  const walletSdkMock = {
    ...mockDeep<WalletRequestSdk>(),
    extensionStatus$: of({
      isWalletLinked: true,
      isExtensionAvailable: true,
    }),
  }

  const storageClient = InMemoryClient()
  const stateClient = StateClient(`rdt:test:12`, storageClient, {
    subjects: stateSubjects,
  })

  const requestItemClient = RequestItemClient(`rdt:test:12`, storageClient, {
    subjects: requestItemSubjects,
  })

  const gatewayClient = GatewayClient({
    gatewayApi: gatewayApiClientMock,
  })

  const walletRequestClient = WalletRequestClient({
    requestItemClient,
    gatewayClient,
    walletRequestSdk: walletSdkMock as any,
    onCancelRequestItem$:
      connectButtonSubjects.onCancelRequestItem.asObservable(),
  })

  connectButtonMock.onShowPopover$ =
    connectButtonSubjects.onShowPopover.asObservable() as any
  connectButtonMock.onConnect$ =
    connectButtonSubjects.onConnect.asObservable() as any
  connectButtonMock.onDisconnect$ =
    connectButtonSubjects.onDisconnect.asObservable() as any
  connectButtonMock.onCancelRequestItem$ =
    connectButtonSubjects.onCancelRequestItem.asObservable() as any
  connectButtonMock.onUpdateSharedData$ =
    connectButtonSubjects.onUpdateSharedData.asObservable() as any
  connectButtonMock.onLinkClick$ =
    connectButtonSubjects.onLinkClick.asObservable() as any

  gatewayApiClientMock.getEntityDetails.mockReturnValue(
    okAsync(undefined) as any,
  )

  return {
    stateClient,
    stateSubjects,
    connectButtonSubjects,
    requestItemClient,
    requestItemSubjects,
    walletRequestClient,
    gatewayClient,
    gatewayApiClient: gatewayApiClientMock,
    connectButton: connectButtonMock,
    walletRequestSdk: walletSdkMock as any,
    storageClient,
  }
}
