import { ResultAsync, err, ok, okAsync } from 'neverthrow'
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
import { WalletData } from '../state/types'
import {
  AwaitedWalletDataRequestResult,
  RequestInterceptorFactoryOutput,
  WalletDataRequestResult,
} from '../_types'

export type DataRequestClient = ReturnType<typeof DataRequestClient>

export const DataRequestClient = ({
  stateClient,
  requestItemClient,
  walletClient,
  useCache,
  dataRequestStateClient,
  requestInterceptor,
}: {
  stateClient: StateClient
  requestItemClient: RequestItemClient
  walletClient: WalletClient
  dataRequestStateClient: DataRequestStateClient
  useCache: boolean
  requestInterceptor: RequestInterceptorFactoryOutput
}) => {
  let challengeGenerator:
    | (() => ResultAsync<string, { error: string; message: string }>)
    | undefined

  let connectResponseCallback:
    | ((result: AwaitedWalletDataRequestResult) => any)
    | undefined

  let dataRequestControl: (
    walletData: WalletData
  ) => ResultAsync<any, { error: string; message: string }>

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

  const provideConnectResponseCallback = (
    fn: (result: AwaitedWalletDataRequestResult) => any
  ) => {
    connectResponseCallback = (result) => fn(result)
  }

  const provideDataRequestControl = (
    fn: (walletData: WalletData) => Promise<any>
  ) => {
    dataRequestControl = (walletData: WalletData) =>
      ResultAsync.fromPromise(fn(walletData), () => ({
        error: 'LoginRejectedByDapp',
        message: 'Login rejected by dApp',
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
  }): WalletDataRequestResult =>
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
        let sessionId = state.sessionId

        if (
          canDataRequestBeResolvedByRdtState(walletDataRequest, state) &&
          useCache
        )
          return okAsync(state.walletData)

        const isLoginRequest =
          !stateClient.getState().walletData.persona &&
          walletDataRequest.discriminator === 'authorizedRequest'

        if (isLoginRequest) {
          sessionId = crypto.randomUUID()
        }

        return requestInterceptor({
          type: 'dataRequest',
          payload: walletDataRequest,
        })
          .map((walletDataRequest) => {
            const { id } = requestItemClient.add(
              isLoginRequest ? 'loginRequest' : 'dataRequest'
            )
            return { walletDataRequest, id }
          })
          .andThen(({ walletDataRequest, id }) =>
            walletClient
              .request(walletDataRequest, id, { sessionId })
              .mapErr(
                ({ error, message }): { error: string; message?: string } => ({
                  error: error,
                  message: message,
                })
              )
              .andThen(transformWalletResponseToRdtWalletData)
              .andThen((response) => {
                if (dataRequestControl)
                  return dataRequestControl(response)
                    .map(() => {
                      requestItemClient.updateStatus({ id, status: 'success' })
                      return response
                    })
                    .mapErr((error) => {
                      requestItemClient.updateStatus({
                        id,
                        status: 'fail',
                        error: error.error,
                      })
                      return error
                    })

                requestItemClient.updateStatus({ id, status: 'success' })
                return ok(response)
              })
              .map((walletData) => {
                if (!oneTime)
                  stateClient.setState({
                    loggedInTimestamp: Date.now().toString(),
                    sessionId,
                    walletData,
                    sharedData: transformWalletRequestToSharedData(
                      walletDataRequest,
                      stateClient.getState().sharedData
                    ),
                  })

                return walletData
              })
          )
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
    provideDataRequestControl,
    provideConnectResponseCallback,
    sendOneTimeRequest,
    setState,
    sendRequest: ({
      isConnect,
      oneTime,
    }: {
      isConnect: boolean
      oneTime: boolean
    }) => {
      const result = sendRequest({
        isConnect,
        oneTime,
        dataRequestState: dataRequestStateClient.getState(),
      })

      if (connectResponseCallback)
        result
          .map((result) => {
            connectResponseCallback!(ok(result))
          })
          .mapErr((error) => {
            connectResponseCallback!(err(error))
          })

      return result
    },
    updateSharedData,
  }
}
