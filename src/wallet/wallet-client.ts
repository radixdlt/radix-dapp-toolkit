import {
  Account,
  Persona,
  WalletSdk as WalletSdkType,
} from '@radixdlt/wallet-sdk'
import { Subscription, tap } from 'rxjs'
import { Logger } from 'tslog'
import { GatewayClient } from '../gateway/gateway'
import { RequestItemClient } from '../request-items/request-item-client'
import { GetState } from '../state/helpers/get-state'
import { DataRequestValue } from '../_types'

export type WalletClient = ReturnType<typeof WalletClient>
export const WalletClient = (input: {
  requestItemClient?: RequestItemClient
  logger?: Logger<unknown>
  walletSdk: WalletSdkType
  gatewayClient: GatewayClient
  getState: GetState
}) => {
  const logger = input.logger
  const requestItemClient =
    input.requestItemClient ||
    RequestItemClient({
      logger,
    })
  const walletSdk = input.walletSdk
  const gatewayClient = input.gatewayClient

  const sendWalletRequest = ({
    oneTimeAccountsWithoutProofOfOwnership,
    ongoingAccountsWithoutProofOfOwnership,
    loginWithoutChallenge,
    usePersona,
    reset = { accounts: false, personaData: false },
  }: Parameters<WalletSdkType['request']>[0]) => {
    const requestInput: DataRequestValue = { reset }

    if (oneTimeAccountsWithoutProofOfOwnership) {
      const { quantity, quantifier } = oneTimeAccountsWithoutProofOfOwnership
      requestInput.oneTimeAccountsWithoutProofOfOwnership = {
        quantity,
        quantifier,
      }
    }

    if (ongoingAccountsWithoutProofOfOwnership)
      requestInput.ongoingAccountsWithoutProofOfOwnership =
        ongoingAccountsWithoutProofOfOwnership

    if (loginWithoutChallenge)
      requestInput.loginWithoutChallenge = loginWithoutChallenge

    if (usePersona) requestInput.usePersona = usePersona

    return input.getState().andThen((state) => {
      // TODO: improve logic for determining requestType
      const requestType =
        !!requestInput.loginWithoutChallenge && !state.persona
          ? 'loginRequest'
          : 'dataRequest'
      const { id } = requestItemClient.add(requestType)

      logger?.debug(`⬆️walletRequest`, requestInput)
      return walletSdk
        .request(requestInput)
        .map((response) => {
          // TODO: response typing should be inferred from request input
          const {
            persona,
            ongoingAccounts = [],
            oneTimeAccounts = [],
          } = response as Partial<{
            oneTimeAccounts: Account[]
            persona: Persona
            ongoingAccounts: Account[]
          }>

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
