import { err, okAsync } from 'neverthrow'
import { WalletInteractionResponse } from '../../../../schemas'
import { RequestItemModule } from '../../request-items'
import { SdkError } from '../../../../error'
import { UpdateConnectButtonStatus, WalletResponseResolver } from '../type'

const matchResponse = (
  input: WalletInteractionResponse,
): string | undefined => {
  if (
    input.discriminator === 'success' &&
    input.items.discriminator === 'preAuthorizationResponse'
  ) {
    return input.items.response?.signedPartialTransaction
  }
}

export const preAuthorizationResponseResolver =
  (dependencies: {
    requestItemModule: RequestItemModule
    updateConnectButtonStatus: UpdateConnectButtonStatus
  }): WalletResponseResolver =>
  ({ walletInteraction, walletInteractionResponse }) => {
    const signedPartialTransaction = matchResponse(walletInteractionResponse)
    if (!signedPartialTransaction) return okAsync(undefined)

    const { interactionId } = walletInteraction

    const { requestItemModule } = dependencies

    return requestItemModule
      .updateStatus({
        id: interactionId,
        status: 'success',
        metadata: {
          signedPartialTransaction,
        },
      })
      .orElse((error) => {
        dependencies.updateConnectButtonStatus('fail')
        return err(SdkError(error.reason, interactionId))
      })
      .andTee(() => dependencies.updateConnectButtonStatus('success'))
      .map(() => undefined)
  }
