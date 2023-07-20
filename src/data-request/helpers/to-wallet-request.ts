import { produce } from 'immer'
import {
  TransformRdtDataRequestToWalletRequestInput,
  transformRdtDataRequestToWalletRequest,
} from '../transformations/rdt-to-wallet'
import { DataRequestState } from '../builders'
import { StateClient } from '../../state/state'

export const toWalletRequest = ({
  dataRequestState,
  isConnect,
  challenge,
  oneTime,
  stateClient,
}: {
  dataRequestState: DataRequestState
  isConnect: boolean
  oneTime: boolean
  challenge?: string
  stateClient: StateClient
}) =>
  transformRdtDataRequestToWalletRequest(
    isConnect,
    produce({}, (draft: TransformRdtDataRequestToWalletRequestInput) => {
      if (dataRequestState.accounts) {
        draft.accounts = {
          numberOfAccounts: dataRequestState.accounts.numberOfAccounts || {
            quantifier: 'atLeast',
            quantity: 1,
          },
          oneTime,
          reset: !!dataRequestState.accounts.reset,
          challenge: dataRequestState.accounts.withProof
            ? challenge
            : undefined,
        }
      }

      const persona = stateClient.getState().walletData.persona

      if (stateClient.getState().walletData.persona) draft.persona = persona

      if (dataRequestState.persona?.withProof)
        draft.persona = { ...(draft.persona ?? {}), challenge }

      if (dataRequestState.personaData)
        draft.personaData = {
          ...dataRequestState.personaData,
          reset: !!dataRequestState.personaData.reset,
          oneTime,
        }
    })
  )
