import { WalletSdk as WalletSdkType } from '@radixdlt/wallet-sdk'
import { Subscription, tap } from 'rxjs'
import { Logger } from 'tslog'
import { removeUndefined } from '../helpers/remove-undefined'
import { RequestItemClient } from '../request-items/request-item-client'

export type WalletClient = ReturnType<typeof WalletClient>
export const WalletClient = (input: {
  requestItemClient?: RequestItemClient
  logger?: Logger<unknown>
  walletSdk: WalletSdkType
}) => {
  const logger = input.logger
  const requestItemClient =
    input.requestItemClient ||
    RequestItemClient({
      logger,
    })
  const walletSdk = input.walletSdk

  const sendWalletRequest = (
    input: Parameters<WalletSdkType['request']>[0]
  ) => {
    const requestInput = {
      usePersona: input['usePersona'],
      loginWithoutChallenge: input['loginWithoutChallenge'],
      ongoingAccountsWithoutProofOfOwnership:
        input['ongoingAccountsWithoutProofOfOwnership'],
    }

    const id = requestItemClient.add({
      type: 'data',
      value: requestInput,
    })

    removeUndefined(requestInput).map((data) =>
      logger?.debug(`⬆️walletRequest`, data)
    )

    return walletSdk
      .request(requestInput)
      .map((response) => {
        requestItemClient.updateStatus(id, 'success')
        logger?.debug(`⬇️walletSuccessResponse`, response)

        return {
          accounts: response.ongoingAccounts,
          persona: response.auth,
        }
      })
      .mapErr((error) => {
        requestItemClient.updateStatus(id, 'fail')
        logger?.debug(`⬇️wallet error response`, error)
        return error
      })
  }

  const subscriptions = new Subscription()

  subscriptions.add(
    requestItemClient.items$
      .pipe(
        tap((items) => {
          requestItemClient.subjects.pendingItems.next(
            items.some((item) => item.status === 'pending')
          )
        })
      )
      .subscribe()
  )

  const sendTransaction = (
    input: Parameters<WalletSdkType['sendTransaction']>[0]
  ) => {
    const id = requestItemClient.add({
      type: 'sendTransaction',
      value: input,
    })

    return walletSdk
      .sendTransaction(input)
      .map((response) => {
        requestItemClient.updateStatus(id, 'success')
        logger?.debug(`⬇️walletSuccessResponse`, response)
        return response
      })
      .mapErr((error) => {
        requestItemClient.updateStatus(id, 'fail')
        logger?.debug(`⬇️wallet error response`, error)
        return error
      })
  }

  return {
    request: sendWalletRequest,
    sendTransaction,
    pendingRequests$: requestItemClient.subjects.pendingItems.asObservable(),
    destroy: () => {
      requestItemClient.destroy()
      walletSdk.destroy()
      subscriptions.unsubscribe()
    },
  }
}
