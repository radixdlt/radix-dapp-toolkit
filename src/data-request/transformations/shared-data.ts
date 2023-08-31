import { WalletSdk } from '@radixdlt/wallet-sdk'
import { produce } from 'immer'
import { SharedData } from '../../state/types'
import { DataRequestState } from '../builders'

export const transformWalletRequestToSharedData = (
  walletDataRequest: Parameters<WalletSdk['request']>[0],
  sharedData: SharedData
): SharedData => {
  if (walletDataRequest.discriminator === 'authorizedRequest')
    return produce({}, (draft: SharedData) => {
      if (walletDataRequest.ongoingAccounts) {
        draft.ongoingAccounts =
          walletDataRequest.ongoingAccounts.numberOfAccounts
      }

      if (walletDataRequest.ongoingPersonaData) {
        draft.ongoingPersonaData = walletDataRequest.ongoingPersonaData
      }
    })

  return sharedData
}

export const transformSharedDataToDataRequestState = (
  sharedData: SharedData
): DataRequestState =>
  produce({}, (draft: DataRequestState) => {
    if (sharedData.ongoingAccounts) {
      draft.accounts = {
        numberOfAccounts: sharedData.ongoingAccounts,
        withProof: false,
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
  })
