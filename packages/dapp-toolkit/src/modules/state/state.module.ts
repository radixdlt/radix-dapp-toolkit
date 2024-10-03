import { BehaviorSubject, Subscription, filter } from 'rxjs'
import { RdtState, WalletData, walletDataDefault } from './types'
import { Logger } from '../../helpers'
import { StorageModule } from '../storage'
import { ok, okAsync, ResultAsync } from 'neverthrow'

export type StateModule = ReturnType<typeof StateModule>

export const StateModule = (input: {
  logger?: Logger
  providers: {
    storageModule: StorageModule<RdtState>
  }
}) => {
  const logger = input?.logger?.getSubLogger({ name: 'StateModule' })
  const storageModule: StorageModule<RdtState> = input.providers.storageModule

  const subscriptions = new Subscription()

  const setState = (state: RdtState) => storageModule.setState(state)

  const getState = (): ResultAsync<RdtState, never> =>
    storageModule
      .getState()
      .orElse(() => okAsync(defaultState))
      .andThen((state) => (state ? ok(state) : ok(defaultState)))

  const patchState = (state: Partial<RdtState>) =>
    getState().andThen((oldState) =>
      setState({ ...oldState, ...state } as RdtState),
    )

  const defaultState = {
    walletData: walletDataDefault,
    loggedInTimestamp: '',
    sharedData: {},
  } satisfies RdtState

  const resetState = () =>
    storageModule.setState(defaultState).map(() => {
      emitWalletData()
    })

  const initializeState = () =>
    getState()
      .map(() => emitWalletData())
      .orElse(() => resetState())

  initializeState()

  const walletDataSubject = new BehaviorSubject<WalletData | undefined>(
    undefined,
  )

  const emitWalletData = () => {
    storageModule.getState().map((state) => {
      walletDataSubject.next(state?.walletData)
    })
  }

  const walletData$ = walletDataSubject
    .asObservable()
    .pipe(filter((walletData): walletData is WalletData => !!walletData))

  return {
    setState,
    patchState,
    getState,
    walletData$,
    emitWalletData,
    getWalletData: () => walletDataSubject.value,
    reset: resetState,
    storage$: storageModule.storage$,
    destroy: () => {
      subscriptions.unsubscribe()
    },
  }
}
