import { mockDeep, type DeepMockProxy } from 'jest-mock-extended'
import { StateClient } from '../state/state'
import { ConnectButtonClient } from '../connect-button/connect-button-client'
import { WalletClient } from '../wallet/wallet-client'
import { GatewayClient } from '../gateway/gateway'
import { WalletSdk, createLogger } from '@radixdlt/wallet-sdk'
import { GatewayApiClient } from '../gateway/gateway-api'
import { RequestItemClient } from '../request-items/request-item-client'
import { StorageProvider } from '../_types'
import { ConnectButtonSubjects } from '../connect-button/subjects'
import { StateSubjects } from '../state/subjects'
import { RequestItemSubjects } from '../request-items/subjects'
import { okAsync } from 'neverthrow'
import { InMemoryClient } from '../storage/in-memory-storage-client'
import { of } from 'rxjs'

export type Context = {
  stateClient: StateClient
  connectButton: ConnectButtonClient
  walletClient: WalletClient
  gatewayClient: GatewayClient
  gatewayApiClient: GatewayApiClient
  walletSdk: WalletSdk
  requestItemClient: RequestItemClient
  storageClient: StorageProvider
}

export type MockContext = {
  requestItemSubjects: RequestItemSubjects
  connectButtonSubjects: ConnectButtonSubjects
  stateSubjects: StateSubjects
  stateClient: StateClient
  walletClient: WalletClient
  requestItemClient: RequestItemClient
  storageClient: StorageProvider
  gatewayClient: GatewayClient
  gatewayApiClient: DeepMockProxy<GatewayApiClient>
  walletSdk: DeepMockProxy<WalletSdk>
  connectButton: DeepMockProxy<ConnectButtonClient>
}

export const createMockContext = (): MockContext => {
  const logger = createLogger(2)

  const stateSubjects = StateSubjects()
  const connectButtonSubjects = ConnectButtonSubjects()
  const requestItemSubjects = RequestItemSubjects()

  const gatewayApiClientMock = mockDeep<GatewayApiClient>()
  const connectButtonMock = mockDeep<ConnectButtonClient>()
  const walletSdkMock = {
    ...mockDeep<WalletSdk>(),
    extensionStatus$: of({
      isWalletLinked: true,
      isExtensionAvailable: true,
    }),
  }

  const storageClient = InMemoryClient()
  const stateClient = StateClient(`rdt:test:12`, storageClient, {
    subjects: stateSubjects,
    logger,
  })

  const requestItemClient = RequestItemClient(`rdt:test:12`, storageClient, {
    subjects: requestItemSubjects,
    logger,
  })

  const gatewayClient = GatewayClient({
    gatewayApi: gatewayApiClientMock,
    logger,
  })

  const walletClient = WalletClient({
    logger,
    requestItemClient,
    gatewayClient,
    walletSdk: walletSdkMock as any,
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

  gatewayApiClientMock.getEntityDetails.mockReturnValue(
    okAsync(undefined) as any
  )

  return {
    stateClient,
    stateSubjects,
    connectButtonSubjects,
    requestItemClient,
    requestItemSubjects,
    walletClient,
    gatewayClient,
    gatewayApiClient: gatewayApiClientMock,
    connectButton: connectButtonMock,
    walletSdk: walletSdkMock as any,
    storageClient,
  }
}
