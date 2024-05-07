import { GatewayApiService } from './gateway.service'
import type { Result } from 'neverthrow'
import { ResultAsync, err } from 'neverthrow'
import { filter, first, firstValueFrom, switchMap } from 'rxjs'
import {
  ExponentialBackoffInput,
  Logger,
  ExponentialBackoff,
} from '../../helpers'
import { SdkError } from '../../error'
import {
  RadixNetworkConfigById,
  TransactionStatus,
  TransactionStatusResponse,
} from './types'
import { GatewayApiClientConfig } from '../../_types'

export type GatewayModule = ReturnType<typeof GatewayModule>

export const GatewayModule = (input: {
  clientConfig: GatewayApiClientConfig
  logger?: Logger
  retryConfig?: ExponentialBackoffInput
  providers?: {
    gatewayApiService?: GatewayApiService
  }
}) => {
  const logger = input.logger?.getSubLogger({ name: 'GatewayModule' })
  const gatewayApi =
    input?.providers?.gatewayApiService ?? GatewayApiService(input.clientConfig)

  const pollTransactionStatus = (
    transactionIntentHash: string,
  ): ResultAsync<TransactionStatusResponse, SdkError> => {
    const retry = ExponentialBackoff(input.retryConfig)

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

  return {
    pollTransactionStatus,
    gatewayApi,
    configuration: input.clientConfig,
  } as const
}
