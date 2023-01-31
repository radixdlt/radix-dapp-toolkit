import { Logger } from 'tslog'
import { StateSubjects } from './subjects'
import {
  ConnectButtonProvider,
  DataRequestInput,
  OnInitCallback,
  RequestData,
  RequestDataOutput,
  State,
  StorageProvider,
} from '../_types'
import {
  concatMap,
  distinctUntilChanged,
  first,
  firstValueFrom,
  map,
  mergeMap,
  of,
  scan,
  Subscription,
  switchMap,
  tap,
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
  useDoneCallback?: boolean
}) => {
  const key = input.key
  const subjects = input.subjects || StateSubjects()
  const logger = input.logger
  const connectButtonClient = input.connectButtonClient
  const walletClient = input.walletClient
  const storageClient = input.storageClient
  const connectDoneCallback = input.useDoneCallback

  const subscriptions = new Subscription()

  const readStateFromStorage = () =>
    storageClient.getData<State>(key).map((state) => {
      if (state) logger?.debug('readFromStorage')
      return state
    })

  const writeStateToStorage = (value: State) => {
    return storageClient.setData(key, value).map(() => {
      logger?.debug('writeToStorage')
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

  const connected$ = subjects.state$.pipe(
    map(({ connected }) => connected),
    distinctUntilChanged()
  )

  subscriptions.add(
    connectButtonClient.onDisconnect$.pipe(tap(resetState)).subscribe()
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
      firstValueFrom(subjects.state$),
      (error) => error as SdkError
    )

  const requestData = (value: DataRequestInput) =>
    getState().andThen((state) => {
      return handleRequest(
        withAuth(
          {
            ongoingAccountsWithoutProofOfOwnership: value.accounts,
          },
          state
        ),
        {
          state,
          logger,
          walletClient,
        }
      ).map(({ data, resolvedBy }) => {
        if (resolvedBy === 'wallet') setState(data, true)
        return data
      })
    })

  subscriptions.add(
    connectButtonClient.onConnect$
      .pipe(
        switchMap(() =>
          subjects.state$.pipe(
            first(),
            mergeMap(
              (state) =>
                input.connectRequest?.((input: DataRequestInput) => {
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
                    .map(({ data, resolvedBy }) => {
                      if (!connectDoneCallback && resolvedBy === 'wallet')
                        setState({ ...data, connected: true }, true)

                      const done = () => {
                        setState({ ...data, connected: true }, true)
                      }

                      return {
                        data,
                        done,
                      }
                    })
                    .mapErr((error) => {
                      setState({ connected: false }, true)
                      return error
                    })
                }) ?? []
            )
          )
        )
      )
      .subscribe()
  )

  return {
    connected$: subjects.state$.pipe(
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
  }
}
