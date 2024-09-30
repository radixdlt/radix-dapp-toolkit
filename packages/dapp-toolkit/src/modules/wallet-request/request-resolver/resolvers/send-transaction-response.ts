import { err, okAsync } from 'neverthrow'
import {
  WalletInteractionResponse,
  WalletTransactionResponseItems,
} from '../../../../schemas'
import { GatewayModule, TransactionStatus } from '../../../gateway'
import { RequestItemModule } from '../../request-items'
import { SdkError } from '../../../../error'
import { UpdateConnectButtonStatus, WalletResponseResolver } from '../type'

const matchResponse = (
  input: WalletInteractionResponse,
): WalletTransactionResponseItems | undefined => {
  if (
    input.discriminator === 'success' &&
    input.items.discriminator === 'transaction'
  ) {
    return input.items
  }
}

const determineFailedTransaction = (status: TransactionStatus) => {
  const failedTransactionStatus: TransactionStatus[] = [
    TransactionStatus.Rejected,
    TransactionStatus.CommittedFailure,
  ]

  return failedTransactionStatus.includes(status)
}

export const sendTransactionResponseResolver =
  (dependencies: {
    gatewayModule: GatewayModule
    requestItemModule: RequestItemModule
    updateConnectButtonStatus: UpdateConnectButtonStatus
  }): WalletResponseResolver =>
  ({ walletInteraction, walletInteractionResponse }) => {
    const transactionResponse = matchResponse(walletInteractionResponse)
    if (!transactionResponse) return okAsync(undefined)

    const { gatewayModule, requestItemModule, updateConnectButtonStatus } =
      dependencies
    const { interactionId } = walletInteraction

    const {
      send: { transactionIntentHash },
    } = transactionResponse

    return gatewayModule
      .pollTransactionStatus(transactionIntentHash)
      .andThen(({ status }) => {
        const isFailedTransaction = determineFailedTransaction(status)
        const requestItemStatus = isFailedTransaction ? 'fail' : 'success'

        return requestItemModule
          .updateStatus({
            id: interactionId,
            status: requestItemStatus,
            transactionIntentHash,
            metadata: { transactionStatus: status },
          })
          .orElse((error) => err(SdkError(error.reason, interactionId)))
          .andThen(() => {
            updateConnectButtonStatus(requestItemStatus)
            return okAsync(undefined)
          })
          .orElse((error) => {
            updateConnectButtonStatus('fail')
            return err(error)
          })
      })
      .map(() => undefined)
  }
