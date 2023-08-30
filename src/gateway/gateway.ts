import { GatewayApiClient } from './gateway-api'
import { Result, ResultAsync } from 'neverthrow'
import {
  EntityMetadataItem,
  TransactionStatus,
  TransactionStatusResponse,
} from '@radixdlt/babylon-gateway-api-sdk'
import { filter, first, firstValueFrom, switchMap } from 'rxjs'
import {
  ExponentialBackoff,
  ExponentialBackoffInput,
} from './helpers/exponential-backoff'
import { AppLogger, createSdkError, SdkError } from '@radixdlt/wallet-sdk'

export const MetadataValue = (value?: EntityMetadataItem) => {
  const typed: any = value?.value?.typed

  return {
    stringified: typed?.value ? typed?.value || '' : typed?.values.join(', '),
  }
}

export type GatewayClient = ReturnType<typeof GatewayClient>

export const GatewayClient = ({
  gatewayApi,
  logger,
  retryConfig,
}: {
  gatewayApi: GatewayApiClient
  logger?: AppLogger
  retryConfig?: ExponentialBackoffInput
}) => {
  const pollTransactionStatus = (transactionIntentHash: string) => {
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

  return { pollTransactionStatus, gatewayApi }
}
