import { err, okAsync } from 'neverthrow'
import {
  SubintentResponseItem,
  WalletInteractionResponse,
} from '../../../../schemas'
import { RequestItemModule } from '../../request-items'
import { SdkError } from '../../../../error'
import { UpdateConnectButtonStatus, WalletResponseResolver } from '../type'
import { RequestStatus } from 'radix-connect-common'

const matchResponse = (
  input: WalletInteractionResponse,
): SubintentResponseItem | undefined => {
  if (
    input.discriminator === 'success' &&
    input.items.discriminator === 'preAuthorizationResponse'
  ) {
    return input.items.response
  }
}

export const preAuthorizationResponseResolver =
  (dependencies: {
    requestItemModule: RequestItemModule
    updateConnectButtonStatus: UpdateConnectButtonStatus
  }): WalletResponseResolver =>
  ({ walletInteraction, walletInteractionResponse }) => {
    const response = matchResponse(walletInteractionResponse)
    if (!response) return okAsync(undefined)
    const { signedPartialTransaction, expirationTimestamp, subintentHash } =
      response

    const { interactionId } = walletInteraction

    const { requestItemModule } = dependencies

    return requestItemModule
      .updateStatus({
        id: interactionId,
        status: RequestStatus.pendingCommit,
        transactionIntentHash: subintentHash,
        walletResponse: walletInteractionResponse,
        metadata: {
          signedPartialTransaction,
          expirationTimestamp,
          subintentHash,
        },
      })
      .orElse((error) => {
        dependencies.updateConnectButtonStatus('fail')
        return err(SdkError(error.reason, interactionId))
      })
      .andTee(() => dependencies.updateConnectButtonStatus('success'))
      .map(() => undefined)
  }
