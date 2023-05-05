import { okAsync } from 'neverthrow'
import { Logger } from 'tslog'
import { WalletClient } from '../../wallet/wallet-client'
import { DataRequestValue, State } from '../../_types'
import isEqual from 'lodash.isequal'

const resolvableByState = (state: State, dataRequest: DataRequestValue) =>
  [
    !!state?.persona,
    isEqual(
      dataRequest.ongoingAccountsWithoutProofOfOwnership,
      state?.sharedData.ongoingAccountsWithoutProofOfOwnership
    ),
    isEqual(
      dataRequest.ongoingPersonaData,
      state?.sharedData.ongoingPersonaData
    ),
  ].reduce((acc, curr) => acc && curr, true)

export type HandleRequestOutput = ReturnType<typeof handleRequest>
// Check if requested data can be resolved by cache otherwise send a wallet request
export const handleRequest = (
  dataRequest: DataRequestValue,
  {
    state,
    logger,
    walletClient,
    useCache = true,
  }: {
    state: State
    logger?: Logger<unknown>
    walletClient: WalletClient
    useCache: boolean
  }
) => {
  const canBeResolvedByState = resolvableByState(state, dataRequest)

  const containsResetRequest =
    dataRequest.reset?.accounts || dataRequest.reset?.personaData

  const containsOneTimeRequest =
    dataRequest.oneTimeAccountsWithoutProofOfOwnership ||
    dataRequest.oneTimePersonaData

  const resolveByState =
    canBeResolvedByState &&
    !containsResetRequest &&
    !containsOneTimeRequest &&
    !dataRequest.loginWithChallenge &&
    useCache

  if (resolveByState) {
    logger?.debug(`resolvedByState`, state)
    return okAsync({
      resolvedBy: 'state',
      data: {
        accounts: state?.accounts!,
        persona: state?.persona!,
        personaData: state?.personaData!,
      },
    })
  }
  logger?.debug(`resolveByWalletRequest`)
  return walletClient.request(dataRequest).map((data) => ({
    resolvedBy: 'wallet',
    data,
  }))
}
