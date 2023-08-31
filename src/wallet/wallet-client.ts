import {
  MessageLifeCycleEvent,
  WalletSdk as WalletSdkType,
} from '@radixdlt/wallet-sdk'
import {
  Observable,
  Subject,
  Subscription,
  filter,
  firstValueFrom,
  map,
  merge,
  switchMap,
  tap,
} from 'rxjs'
import { Logger } from 'tslog'
import { GatewayClient } from '../gateway/gateway'
import { RequestItemClient } from '../request-items/request-item-client'
import { TransactionStatus } from '@radixdlt/babylon-gateway-api-sdk'
import { err, ok } from 'neverthrow'
import { SendTransactionInput } from '../_types'

export type WalletClient = ReturnType<typeof WalletClient>
export const WalletClient = (input: {
  requestItemClient: RequestItemClient
  logger?: Logger<unknown>
  walletSdk: WalletSdkType
  gatewayClient: GatewayClient
  onCancelRequestItem$: Observable<string>
}) => {
  const logger = input.logger
  const requestItemClient = input.requestItemClient
  const walletSdk = input.walletSdk
  const gatewayClient = input.gatewayClient
  const cancelRequestSubject = new Subject<string>()

  const cancelRequestControl = (id: string) => {
    const messageLifeCycleEvent = new Subject<
      MessageLifeCycleEvent['eventType']
    >()
    return {
      eventCallback: (event) => {
        messageLifeCycleEvent.next(event)
      },
      requestControl: ({ cancelRequest, getRequest }) => {
        firstValueFrom(
          messageLifeCycleEvent.pipe(
            filter((event) => event === 'receivedByWallet'),
            map(() => getRequest()),
            tap((request) => {
              if (request.items.discriminator === 'transaction')
                requestItemClient.patch(id, { showCancel: false })
            })
          )
        )

        firstValueFrom(
          merge(input.onCancelRequestItem$, cancelRequestSubject).pipe(
            filter((requestItemId) => requestItemId === id),
            switchMap(() => {
              requestItemClient.cancel(id)
              requestItemClient.updateStatus({
                id,
                status: 'fail',
                error: 'userCancelledRequest',
              })
              return cancelRequest()
            })
          )
        )
      },
    } satisfies Parameters<WalletSdkType['request']>[1]
  }

  const sendWalletRequest = (
    input: Parameters<WalletSdkType['request']>[0],
    requestItemId: string
  ) => {
    return walletSdk
      .request(input, cancelRequestControl(requestItemId))
      .map((response) => {
        logger?.debug(`⬇️walletSuccessResponse`, response)

        return response
      })
      .mapErr((error) => {
        logger?.debug(`⬇️walletErrorResponse`, error)
        requestItemClient.updateStatus({
          id: requestItemId,
          status: 'fail',
          error: error.error,
        })
        return error
      })
  }

  const subscriptions = new Subscription()

  const sendTransaction = ({
    onTransactionId,
    ...rest
  }: SendTransactionInput) => {
    const { id } = requestItemClient.add('sendTransaction')
    return walletSdk
      .sendTransaction({ version: 1, ...rest }, cancelRequestControl(id))
      .mapErr((response) => {
        requestItemClient.updateStatus({
          id,
          status: 'fail',
          error: response.error,
        })
        logger?.debug(`⬇️ walletErrorResponse`, response)
        return response
      })
      .map((response) => {
        logger?.debug(`⬇️ walletSuccessResponse`, response)
        return response
      })
      .andThen(({ transactionIntentHash }) => {
        if (onTransactionId) onTransactionId(transactionIntentHash)
        return gatewayClient
          .pollTransactionStatus(transactionIntentHash)
          .map((transactionStatusResponse) => ({
            transactionIntentHash,
            status: transactionStatusResponse.status,
          }))
      })
      .andThen((response) => {
        const failedTransactionStatus: TransactionStatus[] = [
          TransactionStatus.Rejected,
          TransactionStatus.CommittedFailure,
        ]

        const isFailedTransaction = failedTransactionStatus.includes(
          response.status
        )

        requestItemClient.updateStatus({
          id,
          status: isFailedTransaction ? 'fail' : 'success',
          transactionIntentHash: response.transactionIntentHash,
        })

        logger?.debug(`🔁 Gateway polling finished`, response)

        return isFailedTransaction
          ? err({ ...response, error: 'transactionNotSuccessful' })
          : ok(response)
      })
  }

  return {
    request: sendWalletRequest,
    sendTransaction,
    extensionStatus$: walletSdk.extensionStatus$,
    requestItems$: requestItemClient.items$,
    resetRequestItems: requestItemClient.reset,
    cancelRequest: (id: string) => cancelRequestSubject.next(id),
    destroy: () => {
      requestItemClient.destroy()
      walletSdk.destroy()
      subscriptions.unsubscribe()
    },
  }
}
