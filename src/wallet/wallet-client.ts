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

    const type = !!(
      input.login ||
      input.loginWithChallenge ||
      input.loginWithoutChallenge
    )
      ? 'loginRequest'
      : 'dataRequest'

    const { id } = requestItemClient.add(type)
    removeUndefined(requestInput).map((data) =>
      logger?.debug(`⬆️walletRequest`, data)
    )

    return walletSdk
      .request(requestInput)
      .map((response) => {
        logger?.debug(`⬇️walletSuccessResponse`, response)
        requestItemClient.updateStatus(id, 'success')

        return {
          accounts: response.ongoingAccounts,
          persona: response.persona,
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
    const { id } = requestItemClient.add('sendTransaction')
    return walletSdk
      .sendTransaction(input)
      .map((response) => {
        requestItemClient.updateStatus(id, 'success')
        logger?.debug(`⬇️walletSuccessResponse`, response)
        return response
      })
      .mapErr((error) => {
        requestItemClient.updateStatus(id, 'fail')
        logger?.debug(`⬇️walletErrorResponse`, error)
        return error
      })
  }

  return {
    request: sendWalletRequest,
    sendTransaction,
    pendingRequests$: requestItemClient.subjects.pendingItems.asObservable(),
    requestItems$: requestItemClient.items$,
    resetRequestItems: requestItemClient.reset,
    destroy: () => {
      requestItemClient.destroy()
      walletSdk.destroy()
      subscriptions.unsubscribe()
    },
  }
}
