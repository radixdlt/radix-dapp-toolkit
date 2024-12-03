import { GatewayApiService } from './gateway.service'
import type { Result } from 'neverthrow'
import { ResultAsync, err, ok } from 'neverthrow'
import { filter, first, firstValueFrom, switchMap } from 'rxjs'
import {
  ExponentialBackoffInput,
  Logger,
  ExponentialBackoff,
} from '../../helpers'
import { SdkError } from '../../error'
import { SubintentStatus, TransactionStatus } from './types'
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

  const poll = <T>(
    hash: string,
    apiCall: () => ResultAsync<T | undefined, { reason: string }>,
    exponentialBackoff: ReturnType<ExponentialBackoff>,
  ): ResultAsync<T, SdkError> => {
    return ResultAsync.fromPromise(
      firstValueFrom(
        exponentialBackoff.withBackoff$.pipe(
          switchMap((result) => {
            if (result.isErr())
              return [
                err(
                  SdkError('failedToPoll', '', undefined, {
                    error: result.error,
                    context: 'GatewayModule.poll.retry.withBackoff$',
                    hash,
                  }),
                ),
              ]

            logger?.debug(`Polling ${hash} retry #${result.value + 1}`)

            return apiCall().orElse((response) => {
              if (response.reason === 'FailedToFetch') {
                logger?.debug({
                  error: response,
                  context: 'unexpected error, retrying',
                })
                exponentialBackoff.trigger.next()
                return ok(undefined)
              }

              logger?.debug(response)
              return err(
                SdkError('failedToPoll', '', undefined, {
                  error: response,
                  hash,
                  context: 'GatewayModule.poll',
                }),
              )
            })
          }),
          filter(
            (result): result is Result<T, SdkError> =>
              (result.isOk() && !!result.value) || result.isErr(),
          ),
          first(),
        ),
      ),
      (error) => error as SdkError,
    ).andThen((result) => result)
  }

  const pollTransactionStatus = (
    transactionIntentHash: string,
  ): ResultAsync<TransactionStatus, SdkError> => {
    const exponentialBackoff = ExponentialBackoff(input.retryConfig)
    return poll<TransactionStatus>(
      transactionIntentHash,
      () =>
        gatewayApi
          .getTransactionStatus(transactionIntentHash)
          .map(({ status }) => {
            const completedStatus = new Set<TransactionStatus>([
              'CommittedSuccess',
              'CommittedFailure',
              'Rejected',
            ])
            if (completedStatus.has(status)) return status

            exponentialBackoff.trigger.next()
            return
          }),
      exponentialBackoff,
    )
  }

  const pollSubintentStatus = (
    subintentHash: string,
    expirationTimestamp: number,
  ) => {
    const exponentialBackoff = ExponentialBackoff({
      ...input.retryConfig,
      maxDelayTime: 60_000,
      timeout: new Date(expirationTimestamp * 1000),
    })

    return {
      stop: exponentialBackoff.stop,
      result: poll<{
        subintentStatus: SubintentStatus
        transactionIntentHash: string
      }>(
        subintentHash,
        () =>
          gatewayApi
            .getSubintentStatus(subintentHash)
            .map(
              ({ subintent_status, finalized_at_transaction_intent_hash }) => {
                if (subintent_status === 'CommittedSuccess') {
                  return {
                    subintentStatus: subintent_status,
                    transactionIntentHash: finalized_at_transaction_intent_hash,
                  }
                }

                exponentialBackoff.trigger.next()
                return
              },
            ),

        exponentialBackoff,
      ),
    }
  }

  return {
    pollSubintentStatus,
    pollTransactionStatus,
    gatewayApi,
    configuration: input.clientConfig,
  } as const
}
