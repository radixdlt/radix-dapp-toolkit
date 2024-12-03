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

  const poll = (
    hash: string,
    apiCall: (hash: string) => ResultAsync<string, { reason: string }>,
    completedStatus: Set<string>,
    retry = ExponentialBackoff(input.retryConfig),
  ): ResultAsync<string, SdkError> => {
    return ResultAsync.fromPromise(
      firstValueFrom(
        retry.withBackoff$.pipe(
          switchMap((result) => {
            if (result.isErr())
              return [
                err(
                  SdkError('failedToPoll', '', undefined, {
                    error: result.error,
                    context:
                      'GatewayModule.poll.retry.withBackoff$',
                    hash,
                  }),
                ),
              ]

            logger?.debug(`Polling ${hash} retry #${result.value + 1}`)

            return apiCall(hash)
              .map((response) => {
                if (completedStatus.has(response)) return response

                retry.trigger.next()
                return
              })
              .orElse((response) => {
                if (response.reason === 'FailedToFetch') {
                  logger?.debug({
                    error: response,
                    context: 'unexpected error, retrying',
                  })
                  retry.trigger.next()
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
            (result): result is Result<string, SdkError> =>
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
  ): ResultAsync<TransactionStatus, SdkError> =>
    poll(
      transactionIntentHash,
      (hash) =>
        gatewayApi.getTransactionStatus(hash).map(({ status }) => status),
      new Set<TransactionStatus>([
        'CommittedSuccess',
        'CommittedFailure',
        'Rejected',
      ]),
    ) as ResultAsync<TransactionStatus, SdkError>

  const pollSubintentStatus = (
    subintentHash: string,
    expirationTimestamp: number,
  ) => {
    const backoff = ExponentialBackoff({
      ...input.retryConfig,
      maxDelayTime: 60_000,
      timeout: new Date(expirationTimestamp * 1000),
    })

    return {
      stop: backoff.stop,
      result: poll(
        subintentHash,
        (hash) =>
          gatewayApi
            .getSubintentStatus(hash)
            .map(({ subintent_status }) => subintent_status),
        new Set<SubintentStatus>(['CommittedSuccess']),
        backoff,
      ) as ResultAsync<SubintentStatus, SdkError>,
    }
  }

  return {
    pollSubintentStatus,
    pollTransactionStatus,
    gatewayApi,
    configuration: input.clientConfig,
  } as const
}
