import { okAsync } from 'neverthrow'
import { Logger } from 'tslog'
import { WalletClient } from '../../wallet/wallet-client'
import { DataRequestValue, State } from '../../_types'

const verifyAccounts = (
  accounts: State['accounts'],
  input?: DataRequestValue['ongoingAccountsWithoutProofOfOwnership']
) => {
  if (!input) return true
  else if (!accounts || !input?.quantity || !input?.quantifier) return false
  else if (input.quantifier === 'exactly')
    return accounts.length === input.quantity
  else return accounts.length >= input.quantity
}

export type HandleRequestOutput = ReturnType<typeof handleRequest>
// Check if requested data can be resolved by cache otherwise send a wallet request
export const handleRequest = (
  dataRequest: DataRequestValue,
  {
    state,
    logger,
    walletClient,
  }: {
    state?: State
    logger?: Logger<unknown>
    walletClient: WalletClient
  }
) => {
  const resolvedByState = [
    !!state?.persona,
    verifyAccounts(
      state?.accounts,
      dataRequest.ongoingAccountsWithoutProofOfOwnership
    ),
  ].reduce((acc, curr) => acc && curr, true)

  // TODO: better checking of data requests
  const canBeResolvedByState =
    resolvedByState &&
    !dataRequest.oneTimeAccountsWithoutProofOfOwnership &&
    !dataRequest.reset?.accounts

  if (canBeResolvedByState) {
    logger?.debug(`resolveByState`, state)
    const data = {
      accounts: state?.accounts!,
      persona: state?.persona!,
    }
    return okAsync({
      resolvedBy: 'state',
      data,
      persist: false,
    })
  }
  logger?.debug(`resolveByWalletRequest`)
  return walletClient.request(dataRequest).map((data) => ({
    resolvedBy: 'wallet',
    persist: !dataRequest.oneTimeAccountsWithoutProofOfOwnership,
    data,
  }))
}
