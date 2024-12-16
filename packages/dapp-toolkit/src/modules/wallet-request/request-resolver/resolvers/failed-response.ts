import { err, okAsync } from 'neverthrow'
import {
  WalletInteractionFailureResponse,
  WalletInteractionResponse,
} from '../../../../schemas'
import { RequestItemModule } from '../../request-items'
import { SdkError } from '../../../../error'
import { UpdateConnectButtonStatus, WalletResponseResolver } from '../type'

const matchResponse = (
  input: WalletInteractionResponse,
): WalletInteractionFailureResponse | undefined => {
  if (input.discriminator === 'failure') {
    return input
  }
}

export const failedResponseResolver =
  (dependencies: {
    requestItemModule: RequestItemModule
    updateConnectButtonStatus: UpdateConnectButtonStatus
  }): WalletResponseResolver =>
  ({ walletInteraction, walletInteractionResponse }) => {
    const failedResponse = matchResponse(walletInteractionResponse)
    if (!failedResponse) return okAsync(undefined)

    const { interactionId } = walletInteraction

    const { requestItemModule } = dependencies

    return requestItemModule
      .updateStatus({
        id: interactionId,
        status: 'fail',
        walletResponse: walletInteractionResponse,
      })
      .orElse((error) => {
        dependencies.updateConnectButtonStatus('fail')
        return err(SdkError(error.reason, interactionId))
      })
      .andTee(() => dependencies.updateConnectButtonStatus('fail'))
      .map(() => undefined)
  }
