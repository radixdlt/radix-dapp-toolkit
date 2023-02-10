import { WalletSdk as WalletSdkType } from '@radixdlt/wallet-sdk'
import { Subscription, tap } from 'rxjs'
import { Logger } from 'tslog'
import { RequestItemClient } from '../request-items/request-item-client'
import { DataRequestValue } from '../_types'

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

  const sendWalletRequest = ({
    oneTimeAccountsWithoutProofOfOwnership,
    ongoingAccountsWithoutProofOfOwnership,
    loginWithoutChallenge,
    usePersona,
  }: Parameters<WalletSdkType['request']>[0]) => {
    const requestInput: DataRequestValue = {}

    if (oneTimeAccountsWithoutProofOfOwnership)
      requestInput.oneTimeAccountsWithoutProofOfOwnership =
        oneTimeAccountsWithoutProofOfOwnership

    if (ongoingAccountsWithoutProofOfOwnership)
      requestInput.ongoingAccountsWithoutProofOfOwnership =
        ongoingAccountsWithoutProofOfOwnership

    if (loginWithoutChallenge)
      requestInput.loginWithoutChallenge = loginWithoutChallenge

    if (usePersona) requestInput.usePersona = usePersona

    const requestType = !!requestInput.loginWithoutChallenge
      ? 'loginRequest'
      : 'dataRequest'

    const { id } = requestItemClient.add(requestType)

    logger?.debug(`⬆️walletRequest`, requestInput)

    return walletSdk
      .request(requestInput)
      .map((response) => {
        const {
          ongoingAccounts = [],
          persona,
          oneTimeAccounts = [],
        } = response as any

        logger?.debug(`⬇️walletSuccessResponse`, response)
        requestItemClient.updateStatus({ id, status: 'success' })

        return {
          accounts: [...ongoingAccounts, ...oneTimeAccounts],
          persona: persona,
        }
      })
      .mapErr((error) => {
        requestItemClient.updateStatus({
          id,
          status: 'fail',
          error: error.error,
        })
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
        requestItemClient.updateStatus({
          id,
          status: 'success',
          transactionIntentHash: response.transactionIntentHash,
        })
        logger?.debug(`⬇️walletSuccessResponse`, response)
        return response
      })
      .mapErr((error) => {
        requestItemClient.updateStatus({
          id,
          status: 'fail',
          error: error.error,
        })
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
