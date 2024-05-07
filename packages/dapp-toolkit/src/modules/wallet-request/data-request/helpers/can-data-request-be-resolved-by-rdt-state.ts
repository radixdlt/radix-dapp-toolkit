import type {
  WalletAuthorizedRequestItems,
  WalletUnauthorizedRequestItems,
} from '../../../../schemas'
import type { RdtState } from '../../../state/types'
import { isDeepEqual } from '../../../../helpers/is-deep-equal'

export const canDataRequestBeResolvedByRdtState = (
  dataRequest: WalletUnauthorizedRequestItems | WalletAuthorizedRequestItems,
  state: RdtState,
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
        state.sharedData?.ongoingAccounts?.numberOfAccounts?.quantifier ===
          quantifier &&
        state.sharedData?.ongoingAccounts?.numberOfAccounts?.quantity ===
          quantity
    }

    if (dataRequest.ongoingPersonaData) {
      rdtStateSatisfiesRequest = isDeepEqual(
        dataRequest.ongoingPersonaData,
        state.sharedData?.ongoingPersonaData,
      )
    }

    return rdtStateSatisfiesRequest
  }

  return false
}
