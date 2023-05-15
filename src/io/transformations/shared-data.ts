import {
  WalletAuthorizedRequestItems,
  WalletUnauthorizedRequestItems,
} from '@radixdlt/wallet-sdk'
import { TransformRdtDataRequestToWalletRequestInput } from './rdt-to-wallet'
import { RdtState } from '../schemas'

export const transformSharedData = (
  {
    walletDataRequest,
    rdtDataRequest,
  }: {
    walletDataRequest:
      | WalletUnauthorizedRequestItems
      | WalletAuthorizedRequestItems
    rdtDataRequest: TransformRdtDataRequestToWalletRequestInput['data']
  },
  state: RdtState
): RdtState['sharedData'] => {
  const keepCurrentSharedData =
    walletDataRequest.discriminator === 'unauthorizedRequest'

  if (keepCurrentSharedData) return state.sharedData

  const sharedData = {
    ...state.sharedData,
  } satisfies RdtState['sharedData']

  if (rdtDataRequest.accounts)
    sharedData['ongoingAccounts'] = {
      quantifier: rdtDataRequest.accounts.quantifier,
      quantity: rdtDataRequest.accounts.quantity,
    }

  if (rdtDataRequest.personaData)
    sharedData['ongoingPersonaData'] = {
      fields: rdtDataRequest.personaData.fields,
    }

  return sharedData
}
