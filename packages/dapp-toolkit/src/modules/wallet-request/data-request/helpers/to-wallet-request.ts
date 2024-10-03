import { produce } from 'immer'
import type { TransformRdtDataRequestToWalletRequestInput } from '../transformations/rdt-to-wallet'
import { transformRdtDataRequestToWalletRequest } from '../transformations/rdt-to-wallet'
import type { DataRequestState } from '../builders'
import type { WalletData } from '../../../state'

export const toWalletRequest = ({
  dataRequestState,
  isConnect,
  challenge,
  oneTime,
  walletData,
}: {
  dataRequestState: DataRequestState
  isConnect: boolean
  oneTime: boolean
  challenge?: string
  walletData: WalletData
}) =>
  transformRdtDataRequestToWalletRequest(
    isConnect,
    produce({}, (draft: TransformRdtDataRequestToWalletRequestInput) => {
      if (dataRequestState.proofOfOwnership) {
        draft.proofOfOwnership = {
          ...dataRequestState.proofOfOwnership,
          challenge,
        }
      }

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

      if (dataRequestState.personaData)
        draft.personaData = {
          ...dataRequestState.personaData,
          reset: !!dataRequestState.personaData.reset,
          oneTime,
        }

      if (!oneTime) {
        const persona = walletData.persona

        if (walletData.persona) draft.persona = persona

        if (dataRequestState.persona?.withProof)
          draft.persona = { ...(draft.persona ?? {}), challenge }

        if (Object.values(dataRequestState).length === 0)
          draft.persona = { challenge: undefined }
      }
    }),
  )
