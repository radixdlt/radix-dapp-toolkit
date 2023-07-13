import {
  WalletAuthorizedRequestItems,
  WalletUnauthorizedRequestItems,
} from '@radixdlt/wallet-sdk'
import { RdtState } from '../../state/types'
import isEqual from 'lodash.isequal'

export const canDataRequestBeResolvedByRdtState = (
  dataRequest: WalletUnauthorizedRequestItems | WalletAuthorizedRequestItems,
  state: RdtState
) => {
  if (dataRequest.discriminator === 'authorizedRequest') {
    const isReset =
      dataRequest.reset?.accounts || dataRequest.reset?.personaData

    const isOneTimeRequest = !!(
      dataRequest.oneTimeAccounts || dataRequest.oneTimePersonaData
    )

    const isChallengeRequest =
      dataRequest.auth.discriminator === 'loginWithChallenge' ||
      !!dataRequest.oneTimeAccounts?.challenge ||
      !!dataRequest.ongoingAccounts?.challenge

    if (isReset || isOneTimeRequest || isChallengeRequest) return false

    let rdtStateSatisfiesRequest = false

    if (dataRequest.ongoingAccounts) {
      const { quantifier, quantity } =
        dataRequest.ongoingAccounts.numberOfAccounts
      rdtStateSatisfiesRequest =
        state.sharedData?.ongoingAccounts?.quantifier === quantifier &&
        state.sharedData?.ongoingAccounts?.quantity === quantity
    }

    if (dataRequest.ongoingPersonaData) {
      rdtStateSatisfiesRequest = isEqual(
        dataRequest.ongoingPersonaData,
        state.sharedData?.ongoingPersonaData
      )
    }

    return rdtStateSatisfiesRequest
  }

  return false
}
