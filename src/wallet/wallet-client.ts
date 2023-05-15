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
  merge,
  switchMap,
  tap,
} from 'rxjs'
import { Logger } from 'tslog'
import { GatewayClient } from '../gateway/gateway'
import { RequestItemClient } from '../request-items/request-item-client'

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

  const cancelRequestControl = (id: string) => {
    const messageLifeCycleEvent = new Subject<
      MessageLifeCycleEvent['eventType']
    >()
    return {
      eventCallback: (event) => {
        messageLifeCycleEvent.next(event)
      },
      requestControl: ({ cancelRequest }) => {
        firstValueFrom(
          merge(
            messageLifeCycleEvent.pipe(
              filter((event) => event === 'receivedByWallet'),
              tap(() => {
                requestItemClient.patch(id, { showCancel: false })
              })
            ),
            input.onCancelRequestItem$.pipe(
              filter((requestItemId) => requestItemId === id),
              switchMap(() =>
                cancelRequest().map(() => requestItemClient.cancel(id))
              )
            )
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
        requestItemClient.updateStatus({ id: requestItemId, status: 'success' })
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

  const sendTransaction = (
    input: Parameters<WalletSdkType['sendTransaction']>[0]
  ) => {
    const { id } = requestItemClient.add('sendTransaction')
    return walletSdk
      .sendTransaction(input, cancelRequestControl(id))
      .mapErr((response) => {
        requestItemClient.updateStatus({
          id,
          status: 'fail',
          error: response.error,
        })
        logger?.debug(`⬇️walletErrorResponse`, response)
        return response
      })
      .andThen(({ transactionIntentHash }) =>
        gatewayClient
          .pollTransactionStatus(transactionIntentHash)
          .map((transactionStatusResponse) => ({
            transactionIntentHash,
            status: transactionStatusResponse.status,
          }))
      )
      .map((response) => {
        requestItemClient.updateStatus({
          id,
          status: 'success',
          transactionIntentHash: response.transactionIntentHash,
        })

        logger?.debug(`⬇️walletSuccessResponse`, response)
        return response
      })
  }

  return {
    request: sendWalletRequest,
    sendTransaction,
    requestItems$: requestItemClient.items$,
    resetRequestItems: requestItemClient.reset,
    destroy: () => {
      requestItemClient.destroy()
      walletSdk.destroy()
      subscriptions.unsubscribe()
    },
  }
}
