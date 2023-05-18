import {
  SdkError,
  WalletAuthorizedRequestItems,
  WalletUnauthorizedRequestItems,
} from '@radixdlt/wallet-sdk'
import { DataRequestOutput, RdtState } from '../io/schemas'
import {
  TransformRdtDataRequestToWalletRequestInput,
  transformRdtDataRequestToWalletRequest,
} from '../io/transformations/rdt-to-wallet'
import { transformSharedData } from '../io/transformations/shared-data'
import {
  transformWalletResponseToRdtWalletData,
  withProofs,
} from '../io/transformations/wallet-to-rdt'
import { RequestItemClient } from '../request-items/request-item-client'
import { StateClient } from '../state/state'
import { WalletClient } from './wallet-client'
import { ResultAsync, okAsync } from 'neverthrow'

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
      rdtStateSatisfiesRequest = dataRequest.ongoingPersonaData.fields.every(
        (field) => state.sharedData?.ongoingPersonaData?.fields.includes(field)
      )
    }

    return rdtStateSatisfiesRequest
  }

  return false
}

export type RequestWalletData = ReturnType<
  ReturnType<typeof requestWalletDataFactory>
>
export const requestWalletDataFactory =
  (
    requestItemClient: RequestItemClient,
    walletClient: WalletClient,
    stateClient: StateClient,
    useCache: boolean
  ) =>
  (
    input: TransformRdtDataRequestToWalletRequestInput
  ): ResultAsync<DataRequestOutput, SdkError> => {
    const state = stateClient.getState()

    return transformRdtDataRequestToWalletRequest(input, state).asyncAndThen(
      (walletDataRequest) => {
        const canBeResolvedByState = canDataRequestBeResolvedByRdtState(
          walletDataRequest,
          state
        )

        if (canBeResolvedByState && useCache)
          okAsync({ ...state.walletData, signedChallenges: [] })

        const isLoginRequest =
          input.isConnect ||
          (!state.connected &&
            walletDataRequest.discriminator === 'authorizedRequest')

        const { id } = requestItemClient.add(
          isLoginRequest ? 'loginRequest' : 'dataRequest'
        )

        return walletClient
          .request(walletDataRequest, id)
          .andThen((walletDataResponse) =>
            transformWalletResponseToRdtWalletData(walletDataResponse).map(
              (rdtStateWalletData): DataRequestOutput => {
                const sharedData = transformSharedData(
                  {
                    walletDataRequest,
                    rdtDataRequest: input.data,
                  },
                  state
                )

                if (walletDataRequest.discriminator === 'authorizedRequest')
                  stateClient.setState({
                    connected: true,
                    walletData: rdtStateWalletData,
                    sharedData,
                  })

                return {
                  ...rdtStateWalletData,
                  signedChallenges: withProofs(walletDataResponse),
                }
              }
            )
          )
      }
    )
  }
