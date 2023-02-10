import { Logger } from 'tslog'
import { StateSubjects } from './subjects'
import {
  ConnectButtonProvider,
  DataRequestInput,
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
  firstValueFrom,
  map,
  mergeMap,
  of,
  scan,
  share,
  shareReplay,
  Subscription,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs'
import { WalletClient } from '../wallet/wallet-client'
import { ResultAsync } from 'neverthrow'
import { SdkError } from '@radixdlt/wallet-sdk/dist/helpers/error'
import { handleRequest } from './helpers/handle-request'
import { withAuth } from './helpers/with-auth'
import { removeUndefined } from '../helpers/remove-undefined'

export const defaultState: State = {
  connected: false,
  accounts: [],
}

export type StateClient = ReturnType<typeof StateClient>

export const StateClient = (input: {
  key: string
  initialState?: State
  subjects?: StateSubjects
  logger?: Logger<unknown>
  connectButtonClient: ConnectButtonProvider
  walletClient: WalletClient
  storageClient: StorageProvider
  connectRequest?: (requestData: RequestData) => RequestDataOutput
  onInitCallback: OnInitCallback
  onDisconnectCallback: OnDisconnectCallback
  useDoneCallback?: boolean
}) => {
  const key = input.key
  const subjects = input.subjects || StateSubjects()
  const logger = input.logger
  const connectButtonClient = input.connectButtonClient
  const walletClient = input.walletClient
  const storageClient = input.storageClient
  const connectDoneCallback = input.useDoneCallback
  const disconnectCallback = input.onDisconnectCallback

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

  const state$ = subjects.state$.pipe(share(), shareReplay())

  const connected$ = state$.pipe(
    map(({ connected }) => connected),
    distinctUntilChanged()
  )

  const persona$ = state$.pipe(
    map(({ persona }) => persona),
    distinctUntilChanged()
  )

  const accounts$ = state$.pipe(map(({ accounts }) => accounts))

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

  const getState = () =>
    ResultAsync.fromPromise(
      firstValueFrom(state$),
      (error) => error as SdkError
    )

  const requestData = ({ accounts }: DataRequestInput) =>
    getState().andThen((state) => {
      return handleRequest(
        withAuth(
          {
            [accounts?.oneTime
              ? 'oneTimeAccountsWithoutProofOfOwnership'
              : 'ongoingAccountsWithoutProofOfOwnership']: accounts,
          },
          state
        ),
        {
          state,
          logger,
          walletClient,
        }
      ).map(({ data, resolvedBy, persist }) => {
        if (resolvedBy === 'wallet' && persist)
          setState({ ...data, connected: state.connected }, true)
        return data
      })
    })

  subscriptions.add(
    connectButtonClient.onConnect$
      .pipe(
        tap(() => {
          logger?.debug(`onConnect`)
        }),
        withLatestFrom(state$),
        switchMap(([, state]) => {
          return (
            input.connectRequest?.((input: DataRequestInput<true>) => {
              logger?.debug(`connectRequest`, input)
              connectButtonClient.setConnecting(true)
              return handleRequest(
                withAuth(
                  {
                    ongoingAccountsWithoutProofOfOwnership: input.accounts,
                  },
                  state
                ),
                {
                  state,
                  logger,
                  walletClient,
                }
              )
                .map(({ data }) => {
                  if (!connectDoneCallback) {
                    setState({ ...data, connected: true }, true)
                    connectButtonClient.setConnecting(false)
                  }

                  const done = () => {
                    setState({ ...data, connected: true }, true)
                    connectButtonClient.setConnecting(false)
                  }

                  return {
                    data,
                    done,
                  }
                })
                .mapErr((error) => {
                  setState({ connected: false }, true)
                  connectButtonClient.setConnecting(false)
                  return error
                })
            }) ?? []
          )
        })
      )
      .subscribe()
  )

  return {
    connected$: state$.pipe(
      map(({ connected }) => connected),
      distinctUntilChanged()
    ),
    setConnected: (value: boolean) => subjects.connected.next(value),
    requestData,
    destroy: () => {
      connectButtonClient.destroy()
      walletClient.destroy()
      subscriptions.unsubscribe()
    },
    subjects,
    state$,
  }
}
