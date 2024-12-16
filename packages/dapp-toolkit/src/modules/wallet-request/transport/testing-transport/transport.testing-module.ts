import { okAsync, ResultAsync } from 'neverthrow'
import { TransportProvider } from '../../../../_types'
import { WalletInteractionResponse } from '../../../../schemas'

export const TestingTransportModule = ({
  requestResolverModule,
}: {
  requestResolverModule: {
    addWalletResponses: (
      responses: WalletInteractionResponse[],
    ) => ResultAsync<unknown, unknown>
  }
}): TransportProvider & {
  setNextWalletResponse: (response: WalletInteractionResponse) => void
} => {
  let _isSupported = true
  let id = 'TestingTransportModule'
  let _sendResponse: WalletInteractionResponse

  return {
    id,
    isSupported: () => _isSupported,
    destroy: () => {},
    disconnect: () => {},
    send: () => {
      requestResolverModule.addWalletResponses([_sendResponse])
      return okAsync(_sendResponse)
    },

    // Test helpers
    setNextWalletResponse: (response: WalletInteractionResponse) => {
      _sendResponse = response
    },
  }
}
