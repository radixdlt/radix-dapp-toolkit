import { ResultAsync, ok, okAsync } from 'neverthrow'
import { DataRequestState, DataRequestBuilderItem } from './builders'
import { StateClient } from '../state/state'
import { RequestItemClient } from '../request-items/request-item-client'
import { WalletClient } from '../wallet/wallet-client'
import { transformWalletResponseToRdtWalletData } from './transformations/wallet-to-rdt'
import { toWalletRequest } from './helpers/to-wallet-request'
import { canDataRequestBeResolvedByRdtState } from './helpers/can-data-request-be-resolved-by-rdt-state'
import {
  transformSharedDataToDataRequestState,
  transformWalletRequestToSharedData,
} from './transformations/shared-data'
import { DataRequestStateClient } from './data-request-state'

export type DataRequestClient = ReturnType<typeof DataRequestClient>

export const DataRequestClient = ({
  stateClient,
  requestItemClient,
  walletClient,
  useCache,
  dataRequestStateClient,
}: {
  stateClient: StateClient
  requestItemClient: RequestItemClient
  walletClient: WalletClient
  dataRequestStateClient: DataRequestStateClient
  useCache: boolean
}) => {
  let challengeGenerator:
    | (() => ResultAsync<string, { error: string; message: string }>)
    | undefined

  const isChallengeNeeded = (dataRequestState: DataRequestState) =>
    dataRequestState.accounts?.withProof || dataRequestState.persona?.withProof

  const getChallenge = (
    dataRequestState: DataRequestState
  ): ResultAsync<string | undefined, { error: string; message: string }> => {
    if (!isChallengeNeeded(dataRequestState)) return okAsync(undefined)
    if (!challengeGenerator)
      throw new Error('Expected proof but no challenge generator provided')

    return challengeGenerator()
  }

  const provideChallengeGenerator = (fn: () => Promise<string>) => {
    challengeGenerator = () =>
      ResultAsync.fromPromise(fn(), () => ({
        error: 'GenerateChallengeError',
        message: 'Failed to generate challenge',
      }))
  }

  const sendOneTimeRequest = (...items: DataRequestBuilderItem[]) =>
    sendRequest({
      dataRequestState: dataRequestStateClient.toDataRequestState(...items),
      isConnect: false,
      oneTime: true,
    })

  const sendRequest = ({
    isConnect,
    oneTime,
    dataRequestState,
  }: {
    dataRequestState: DataRequestState
    isConnect: boolean
    oneTime: boolean
  }) =>
    ok(dataRequestState)
      .asyncAndThen((dataRequestState) =>
        getChallenge(dataRequestState).andThen((challenge) =>
          toWalletRequest({
            dataRequestState,
            isConnect,
            challenge,
            oneTime,
            stateClient,
          })
        )
      )
      .andThen((walletDataRequest) => {
        const state = stateClient.getState()
        if (
          canDataRequestBeResolvedByRdtState(walletDataRequest, state) &&
          useCache
        )
          return okAsync(state.walletData)

        const isLoginRequest =
          !stateClient.getState().walletData.persona &&
          walletDataRequest.discriminator === 'authorizedRequest'

        const { id } = requestItemClient.add(
          isLoginRequest ? 'loginRequest' : 'dataRequest'
        )

        return walletClient
          .request(walletDataRequest, id)
          .mapErr(
            ({ error, message }): { error: string; message?: string } => ({
              error: error,
              message: message,
            })
          )
          .andThen(transformWalletResponseToRdtWalletData)
          .map((walletData) => {
            if (!oneTime)
              stateClient.setState({
                walletData,
                sharedData: transformWalletRequestToSharedData(
                  walletDataRequest,
                  stateClient.getState().sharedData
                ),
              })

            return walletData
          })
      })

  const setState = (...items: DataRequestBuilderItem[]) => {
    dataRequestStateClient.setState(...items)
    return {
      sendRequest: () =>
        sendRequest({
          dataRequestState: dataRequestStateClient.getState(),
          isConnect: false,
          oneTime: false,
        }),
    }
  }

  const updateSharedData = () =>
    sendRequest({
      dataRequestState: transformSharedDataToDataRequestState(
        stateClient.getState().sharedData
      ),
      isConnect: false,
      oneTime: false,
    })

  return {
    provideChallengeGenerator,
    sendOneTimeRequest,
    setState,
    sendRequest: ({
      isConnect,
      oneTime,
    }: {
      isConnect: boolean
      oneTime: boolean
    }) =>
      sendRequest({
        isConnect,
        oneTime,
        dataRequestState: dataRequestStateClient.getState(),
      }),
    updateSharedData,
  }
}
