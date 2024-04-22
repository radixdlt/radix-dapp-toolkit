import type { GatewayApiClient } from './gateway-api'
import type { Result } from 'neverthrow'
import { ResultAsync, err } from 'neverthrow'
import { filter, first, firstValueFrom, switchMap } from 'rxjs'
import { ExponentialBackoffInput, Logger, ExponentialBackoff } from '../helpers'
import { SdkError } from '../error'
import { TransactionStatus, TransactionStatusResponse } from './types'

export type GatewayClient = ReturnType<typeof GatewayClient>

export const GatewayClient = ({
  gatewayApi,
  logger,
  retryConfig,
}: {
  gatewayApi: GatewayApiClient
  logger?: Logger
  retryConfig?: ExponentialBackoffInput
}) => {
  const pollTransactionStatus = (
    transactionIntentHash: string,
  ): ResultAsync<TransactionStatusResponse, SdkError> => {
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
            if (result.isErr())
              return [err(SdkError('failedToPollSubmittedTransaction', ''))]

            logger?.debug(`pollingTxStatus retry #${result.value + 1}`)

            return gatewayApi
              .getTransactionStatus(transactionIntentHash)
              .map((response) => {
                if (completedTransactionStatus.has(response.status))
                  return response

                retry.trigger.next()
                return
              })
              .mapErr((response) => {
                logger?.debug(response)
                return SdkError('failedToPollSubmittedTransaction', '')
              })
          }),
          filter(
            (result): result is Result<TransactionStatusResponse, SdkError> =>
              (result.isOk() && !!result.value) || result.isErr(),
          ),
          first(),
        ),
      ),
      (error) => error as SdkError,
    ).andThen((result) => result)
  }

  return { pollTransactionStatus, gatewayApi }
}
