import { produce } from 'immer'
import type { SharedData } from '../../../state/types'
import type { DataRequestState } from '../builders'
import type { WalletInteraction } from '../../../../schemas'

export const transformWalletRequestToSharedData = (
  walletInteraction: WalletInteraction,
  sharedData: SharedData,
): SharedData => {
  const { items: walletDataRequest } = walletInteraction
  if (walletDataRequest.discriminator === 'authorizedRequest')
    return produce({}, (draft: SharedData) => {
      draft.persona = { proof: false }

      draft.ongoingAccounts = {
        proof: false,
        numberOfAccounts: undefined,
      }

      if (walletDataRequest.auth.discriminator === 'loginWithChallenge')
        draft.persona.proof = !!walletDataRequest.auth.challenge

      if (walletDataRequest.ongoingAccounts) {
        draft.ongoingAccounts = {
          proof: !!walletDataRequest.ongoingAccounts.challenge,
          numberOfAccounts: walletDataRequest.ongoingAccounts.numberOfAccounts,
        }
      }

      if (walletDataRequest.ongoingPersonaData) {
        draft.ongoingPersonaData = walletDataRequest.ongoingPersonaData
      }
    })

  return sharedData
}

export const transformSharedDataToDataRequestState = (
  sharedData: SharedData,
): DataRequestState =>
  produce({}, (draft: DataRequestState) => {
    if (sharedData.ongoingAccounts) {
      draft.accounts = {
        numberOfAccounts: sharedData.ongoingAccounts.numberOfAccounts!,
        withProof: sharedData.ongoingAccounts.proof,
        reset: true,
      }
    }

    if (sharedData.ongoingPersonaData) {
      draft.personaData = {
        fullName: sharedData.ongoingPersonaData.isRequestingName,
        phoneNumbers:
          sharedData.ongoingPersonaData.numberOfRequestedPhoneNumbers,
        emailAddresses:
          sharedData.ongoingPersonaData.numberOfRequestedEmailAddresses,
        reset: true,
      }
    }

    if (sharedData.persona) {
      draft.persona = { withProof: !!sharedData.persona.proof }
    }
  })
