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
  switchMap,
  tap,
} from 'rxjs'
import { Logger } from 'tslog'
import { GatewayClient } from '../gateway/gateway'
import { RequestItemClient } from '../request-items/request-item-client'
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
          input.onCancelRequestItem$.pipe(
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
        logger?.debug(`⬇️walletErrorResponse`, response)
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
    extensionStatus$: walletSdk.extensionStatus$,
    requestItems$: requestItemClient.items$,
    resetRequestItems: requestItemClient.reset,
    destroy: () => {
      requestItemClient.destroy()
      walletSdk.destroy()
      subscriptions.unsubscribe()
    },
  }
}
