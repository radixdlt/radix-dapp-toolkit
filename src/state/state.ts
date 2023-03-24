import { Logger } from 'tslog'
import { StateSubjects } from './subjects'
import {
  ConnectButtonProvider,
  DataRequestInput,
  DataRequestValue,
  OnDisconnectCallback,
  OnInitCallback,
  RequestData,
  RequestDataOutput,
  State,
  StorageProvider,
} from '../_types'
import {
  concatMap,
  distinctUntilChanged,
  EMPTY,
  map,
  merge,
  mergeMap,
  of,
  scan,
  Subscription,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs'
import { WalletClient } from '../wallet/wallet-client'
import { handleRequest } from './helpers/handle-request'
import { withAuth } from './helpers/with-auth'
import { removeUndefined } from '../helpers/remove-undefined'
import { GetState } from './helpers/get-state'
import { ok, Result } from 'neverthrow'
import { SdkError } from '@radixdlt/wallet-sdk'

export const defaultState: State = {
  connected: false,
  accounts: [],
  sharedData: {},
}

export type StateClient = ReturnType<typeof StateClient>

export const StateClient = (input: {
  key: string
  initialState?: State
  subjects: StateSubjects
  logger?: Logger<unknown>
  connectButtonClient: ConnectButtonProvider
  walletClient: WalletClient
  storageClient: StorageProvider
  connectRequest?: (requestData: RequestData) => RequestDataOutput
  onInitCallback: OnInitCallback
  onDisconnectCallback: OnDisconnectCallback
  useDoneCallback?: boolean
  getState: GetState
}) => {
  const key = input.key
  const subjects = input.subjects
  const logger = input.logger
  const connectButtonClient = input.connectButtonClient
  const walletClient = input.walletClient
  const storageClient = input.storageClient
  const connectDoneCallback = input.useDoneCallback
  const disconnectCallback = input.onDisconnectCallback
  const getState = input.getState
  const subscriptions = new Subscription()

  const readStateFromStorage = () =>
    storageClient.getData<State>(key).map((state) => {
      if (state) logger?.debug('readFromStorage')
      return state
    })

  const writeStateToStorage = (value: State) => {
    return storageClient.setData(key, value).map(() => {
      logger?.debug('writeToStorage', value)
    })
  }

  const setState = (state: Partial<State>, persist: boolean = false) => {
    removeUndefined(state).map((data) => {
      if (Object.keys(data).length)
        subjects.setState.next({ state: data, persist })
    })
  }

  const resetState = () => {
    subjects.setState.next({ state: defaultState, persist: true })
  }

  const onInit = (state: State) => {
    if (input?.onInitCallback) input?.onInitCallback(state)
    return setState(state)
  }

  const initializeState = () => {
    // TODO: validate injected state
    if (input.initialState) {
      logger?.debug(`initializeStateFromInput`)
      return onInit(input.initialState)
    } else {
      return readStateFromStorage().map((storedState) => {
        // TODO: validate stored state
        if (storedState) {
          logger?.debug(`initializeStateFromStorage`)
          return onInit(storedState)
        } else {
          logger?.debug(`initializeStateFromDefault`)
          return onInit(defaultState)
        }
      })
    }
  }

  initializeState()

  const state$ = subjects.state$

  const connected$ = state$.pipe(
    map(({ connected }) => connected),
    distinctUntilChanged()
  )

  const persona$ = state$.pipe(
    map(({ persona }) => persona),
    distinctUntilChanged()
  )

  const accounts$ = state$.pipe(map(({ accounts }) => accounts))

  const personaData$ = state$.pipe(map(({ personaData }) => personaData))

  subscriptions.add(
    state$
      .pipe(
        tap((state) => {
          logger?.debug(`state$`, state)
        })
      )
      .subscribe()
  )

  subscriptions.add(
    accounts$
      .pipe(
        tap((accounts) => {
          connectButtonClient.setAccounts(accounts || [])
        })
      )
      .subscribe()
  )

  subscriptions.add(
    personaData$
      .pipe(
        tap((personaData) => {
          connectButtonClient.setPersonaData(personaData || [])
        })
      )
      .subscribe()
  )

  subscriptions.add(
    persona$
      .pipe(
        tap((persona) => {
          connectButtonClient.setPersonaLabel(persona?.label ?? '')
        })
      )
      .subscribe()
  )

  subscriptions.add(
    connectButtonClient.onDisconnect$
      .pipe(
        tap(() => {
          resetState()
          walletClient.resetRequestItems()
          disconnectCallback()
        })
      )
      .subscribe()
  )

  subscriptions.add(
    walletClient.pendingRequests$
      .pipe(
        tap((isLoading) => {
          connectButtonClient.setLoading(isLoading)
        })
      )
      .subscribe()
  )

  subscriptions.add(
    walletClient.requestItems$
      .pipe(
        tap((items) => {
          connectButtonClient.setRequestItems(items)

          connectButtonClient.setConnecting(
            items.some(
              (item) =>
                item.status === 'pending' && item.type === 'loginRequest'
            )
          )
        })
      )
      .subscribe()
  )

  subscriptions.add(
    connected$
      .pipe(
        tap((value) => {
          connectButtonClient.setConnected(value)
        })
      )
      .subscribe()
  )

  subscriptions.add(
    subjects.setState
      .pipe(
        concatMap(({ state, persist }) =>
          of(state).pipe(
            scan((acc, curr) => ({ ...acc, ...curr }), defaultState),
            mergeMap((state) => {
              logger?.debug('stateUpdated', state)
              subjects.state$.next(state)
              return persist ? writeStateToStorage(state) : []
            })
          )
        )
      )
      .subscribe()
  )

  const handleErrorResponse = (error: SdkError) => {
    if (error.error === 'invalidPersona') resetState()

    return error
  }

  const requestData = (value: DataRequestInput) =>
    getState().andThen((state) =>
      transformRequest(value)
        .andThen((value) => withAuth(value, state.persona))
        .asyncAndThen((walletRequest) =>
          handleRequest(walletRequest, {
            state,
            logger,
            walletClient,
          })
            .map(({ data: response, resolvedBy }) => {
              if (resolvedBy === 'wallet') {
                const {
                  ongoingAccountsWithoutProofOfOwnership,
                  ongoingPersonaData,
                } = walletRequest

                setState(
                  {
                    connected: !!state.persona || !!response.persona,
                    sharedData: {
                      ongoingPersonaData,
                      ongoingAccountsWithoutProofOfOwnership,
                    },
                    accounts: response.accounts,
                    personaData: response.personaData,
                    persona: response.persona,
                  },
                  true
                )
              }

              return response
            })
            .mapErr(handleErrorResponse)
        )
    )

  const transformRequest = (
    value: DataRequestInput<false>
  ): Result<DataRequestValue, never> => {
    const { accounts, personaData } = value

    const output: DataRequestValue = {
      reset: { accounts: !!accounts?.reset, personaData: !!personaData?.reset },
    }

    if (accounts) {
      const key = accounts.oneTime
        ? 'oneTimeAccountsWithoutProofOfOwnership'
        : 'ongoingAccountsWithoutProofOfOwnership'
      output[key] = accounts
    }

    if (personaData) {
      const key = personaData.oneTime
        ? 'oneTimePersonaData'
        : 'ongoingPersonaData'
      output[key] = personaData
    }

    return ok(output)
  }

  const handleConnect = () =>
    input.connectRequest!((value: DataRequestInput<true>) => {
      logger?.debug(`connectRequest`, value)
      return getState().andThen((state) =>
        transformRequest(value)
          .andThen((value) => withAuth(value, state.persona))
          .asyncAndThen((walletRequest) =>
            handleRequest(walletRequest, {
              state,
              logger,
              walletClient,
            })
              .map(({ data }) => {
                const {
                  ongoingAccountsWithoutProofOfOwnership,
                  ongoingPersonaData,
                } = walletRequest

                const sharedData = {
                  ongoingAccountsWithoutProofOfOwnership,
                  ongoingPersonaData,
                }

                const done = () => {
                  setState({ ...data, connected: true, sharedData }, true)
                }

                if (!connectDoneCallback) done()

                return {
                  data,
                  done,
                }
              })
              .mapErr((error) => {
                setState({ connected: false }, true)
                return error
              })
          )
      )
    })

  subscriptions.add(
    merge(connectButtonClient.onUpdateSharedData$, subjects.updateSharedData)
      .pipe(
        withLatestFrom(state$),
        switchMap(([, state]) => {
          const output: DataRequestInput<false> = {}

          if (state.sharedData.ongoingAccountsWithoutProofOfOwnership)
            output.accounts = {
              ...state.sharedData.ongoingAccountsWithoutProofOfOwnership,
              reset: true,
            }

          if (state.sharedData.ongoingPersonaData)
            output.personaData = {
              ...state.sharedData.ongoingPersonaData,
              reset: true,
            }

          if (Object.keys(output).length === 0) return EMPTY

          return requestData(output)
        })
      )
      .subscribe()
  )

  subscriptions.add(
    connectButtonClient.onConnect$
      .pipe(switchMap(() => handleConnect() ?? EMPTY))
      .subscribe()
  )

  const reset = () => {
    resetState()
    walletClient.resetRequestItems()
  }

  return {
    connected$: state$.pipe(
      map(({ connected }) => connected),
      distinctUntilChanged()
    ),
    setConnected: (value: boolean) => subjects.connected.next(value),
    requestData,
    destroy: () => {
      reset()
      connectButtonClient.destroy()
      walletClient.destroy()
      subscriptions.unsubscribe()
    },
    subjects,
    state$,
    reset,
  }
}
