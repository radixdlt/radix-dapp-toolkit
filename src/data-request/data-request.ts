import { ResultAsync, errAsync, ok, okAsync } from 'neverthrow'
import { DataRequestState, DataRequestRawItem } from './_types'
import { BehaviorSubject } from 'rxjs'
import { StateClient } from '../state/state'
import { RequestItemClient } from '../request-items/request-item-client'
import { WalletClient } from '../wallet/wallet-client'
import { transformWalletResponseToRdtWalletData } from './transformations/wallet-to-rdt'
import { toWalletRequest } from './helpers/to-wallet-request'
import { canDataRequestBeResolvedByRdtState } from './helpers/can-data-request-be-resolved-by-rdt-state'
import { transformSharedDataToDataRequestState } from './transformations/shared-data'
import { produce } from 'immer'

export type DataRequestClient = ReturnType<typeof DataRequestClient>

export const DataRequestClient = ({
  stateClient,
  requestItemClient,
  walletClient,
  useCache,
}: {
  stateClient: StateClient
  requestItemClient: RequestItemClient
  walletClient: WalletClient
  useCache: boolean
}) => {
  const initialState: DataRequestState = {
    accounts: {
      numberOfAccounts: { quantifier: 'atLeast', quantity: 1 },
      reset: false,
      withProof: false,
    },
  }
  const state = new BehaviorSubject<DataRequestState>(initialState)

  const update = (input: DataRequestState) => state.next(input)
  const reset = () => state.next(initialState)
  const getState = () => state.getValue()

  let challengeGenerator: (() => ResultAsync<string, Error>) | undefined

  const isChallengeNeeded = (dataRequestState: DataRequestState) =>
    dataRequestState.accounts?.withProof || dataRequestState.persona?.withProof

  const getChallenge = (
    dataRequestState: DataRequestState
  ): ResultAsync<string | undefined, Error> => {
    if (!isChallengeNeeded(dataRequestState)) return okAsync(undefined)
    if (!challengeGenerator)
      throw new Error('Expected proof but no challenge generator provided')

    return challengeGenerator()
  }

  const provideChallengeGenerator = (fn: () => Promise<string>) => {
    challengeGenerator = () =>
      ResultAsync.fromPromise(fn(), () => Error('Failed to generate challenge'))
  }

  const sendOneTimeRequest = (...items: DataRequestRawItem[]) =>
    sendRequest({
      dataRequestState: toDataRequestState(...items),
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
          .andThen(transformWalletResponseToRdtWalletData)
      })

  const toDataRequestState = (
    ...items: DataRequestRawItem[]
  ): DataRequestState =>
    items.reduce((acc, item) => ({ ...acc, ...item._toObject() }), {})

  const setState = (...items: DataRequestRawItem[]) => {
    if (items.length === 0) reset()
    else {
      update(toDataRequestState(...items))
    }
    return {
      sendRequest: () =>
        sendRequest({
          dataRequestState: getState(),
          isConnect: false,
          oneTime: false,
        }),
    }
  }

  const patchState = (...items: DataRequestRawItem[]) => {
    if (items.length === 0) return
    update({ ...getState(), ...toDataRequestState(...items) })

    return {
      sendRequest: () =>
        sendRequest({
          dataRequestState: getState(),
          isConnect: false,
          oneTime: false,
        }),
    }
  }

  const removeState = (...keys: (keyof DataRequestState)[]) => {
    update(
      produce(getState(), (draft: DataRequestState) => {
        keys.forEach((key) => {
          delete draft[key]
        })
      })
    )

    return {
      sendRequest: () =>
        sendRequest({
          dataRequestState: getState(),
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
    getState,
    setState,
    patchState,
    removeState,
    sendRequest: ({
      isConnect,
      oneTime,
    }: {
      isConnect: boolean
      oneTime: boolean
    }) => sendRequest({ isConnect, oneTime, dataRequestState: getState() }),
    updateSharedData,
    state$: state.asObservable(),
  }
}
