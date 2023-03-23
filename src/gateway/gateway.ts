import { GatewayApiClient } from './gateway-api'
import { Result, ResultAsync } from 'neverthrow'
import { errorIdentity } from '../helpers/error-identity'
import {
  TransactionStatus,
  TransactionStatusResponse,
} from '@radixdlt/babylon-gateway-api-sdk'
import { filter, first, firstValueFrom, switchMap } from 'rxjs'
import {
  ExponentialBackoff,
  ExponentialBackoffInput,
} from './helpers/exponential-backoff'
import { Logger } from 'tslog'
import { createSdkError, SdkError } from '@radixdlt/wallet-sdk'

export type GatewayClient = ReturnType<typeof GatewayClient>

export const GatewayClient = ({
  gatewayApi,
  logger,
  retryConfig,
}: {
  gatewayApi: GatewayApiClient
  logger?: Logger<unknown>
  retryConfig?: ExponentialBackoffInput
}) => {
  const getTransactionStatusRequest = (transactionIntentHashHex: string) =>
    ResultAsync.fromPromise(
      gatewayApi.getTransactionStatus(transactionIntentHashHex),
      errorIdentity
    )

  const getTransactionDetailsRequest = (
    transactionIntentHashHex: string,
    stateVersion?: number
  ) =>
    ResultAsync.fromPromise(
      gatewayApi.getTransactionDetails(transactionIntentHashHex, stateVersion),
      errorIdentity
    )

  const pollTransactionStatus = (transactionIntentHashHex: string) => {
    const retry = ExponentialBackoff(retryConfig)

    const completedTransactionStatus = new Set<TransactionStatus>([
      'CommittedSuccess',
      'CommittedFailure',
      'Rejected',
    ])

    return ResultAsync.fromPromise(
      firstValueFrom(
        retry.withBackoff$.pipe(
          switchMap((result) => {
            if (result.isErr()) return [result]

            logger?.debug(`pollingTxStatus retry #${result.value + 1}`)

            return getTransactionStatusRequest(transactionIntentHashHex)
              .map((response) => {
                if (completedTransactionStatus.has(response.status))
                  return response

                retry.trigger.next()
                return
              })
              .mapErr((response) => {
                logger?.debug(response)
                return createSdkError('failedToPollSubmittedTransaction', '')
              })
          }),
          filter(
            (result): result is Result<TransactionStatusResponse, SdkError> =>
              (result.isOk() && !!result.value) || result.isErr()
          ),
          first()
        )
      ),
      (error) => error as SdkError
    ).andThen((result) => result)
  }

  return { pollTransactionStatus, getTransactionDetailsRequest, gatewayApi }
}
