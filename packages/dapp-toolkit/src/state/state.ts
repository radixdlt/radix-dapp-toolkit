import {
  BehaviorSubject,
  Subscription,
  filter,
  merge,
  of,
  switchMap,
} from 'rxjs'
import { RdtState, WalletData, walletDataDefault } from './types'
import { Logger } from '../helpers'
import { StorageProvider } from '../storage/local-storage-client'
import { SdkError } from '../error'
import { err, ok } from 'neverthrow'

export type StateClient = ReturnType<typeof StateClient>

export const StateClient = (input: {
  providers: {
    storageClient: StorageProvider<RdtState>
  }
  logger?: Logger
}) => {
  const logger = input?.logger?.getSubLogger({ name: 'StateClient' })
  const storageClient = input.providers.storageClient

  const subscriptions = new Subscription()

  const setState = (state: RdtState) => storageClient.setState(state)

  const getState = () =>
    storageClient
      .getState()
      .andThen((state) =>
        state ? ok(state) : err(SdkError('StateNotFound', '')),
      )

  const patchState = (state: Partial<RdtState>) =>
    getState().andThen((oldState) => setState({ ...oldState, ...state }))

  const defaultState = {
    walletData: walletDataDefault,
    loggedInTimestamp: '',
    sharedData: {},
  } satisfies RdtState

  const resetState = () => storageClient.setState(defaultState)

  const initializeState = () =>
    getState().mapErr(() => {
      logger?.debug({
        module: 'StateClient',
        method: `initializeState.loadedCorruptedStateFromStorage`,
      })
      resetState()
    })

  initializeState()

  const walletDataSubject = new BehaviorSubject<WalletData | undefined>(
    undefined,
  )

  subscriptions.add(
    merge(storageClient.storage$, of(null))
      .pipe(
        switchMap(() =>
          getState().map((state) => {
            walletDataSubject.next(state.walletData)
          }),
        ),
      )
      .subscribe(),
  )

  const walletData$ = walletDataSubject
    .asObservable()
    .pipe(filter((walletData): walletData is WalletData => !!walletData))

  return {
    setState,
    patchState,
    getState,
    walletData$,
    getWalletData: () => walletDataSubject.value,
    reset: resetState,
    destroy: () => {
      subscriptions.unsubscribe()
    },
    store: storageClient,
  }
}
