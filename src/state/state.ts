import { Logger } from 'tslog'
import { StateSubjects } from './subjects'
import { StorageProvider } from '../_types'
import {
  Subscription,
  combineLatest,
  debounceTime,
  filter,
  first,
  map,
  skip,
  switchMap,
  tap,
} from 'rxjs'
import { ResultAsync } from 'neverthrow'
import { RdtState, walletDataDefault } from './types'
import { produce } from 'immer'
import isEqual from 'lodash.isequal'

export type StateClient = ReturnType<typeof StateClient>

export const StateClient = (
  key: string,
  storageClient: StorageProvider,
  options: Partial<{
    subjects: StateSubjects
    logger: Logger<unknown>
  }>
) => {
  const logger = options.logger
  const subjects = options.subjects ?? StateSubjects()

  const subscriptions = new Subscription()

  const state = combineLatest([
    subjects.walletData,
    subjects.sharedData,
    subjects.loggedInTimestamp,
  ]).pipe(
    map(([walletData, sharedData, loggedInTimestamp]) => ({
      walletData,
      sharedData,
      loggedInTimestamp,
    }))
  )

  const readStateFromStorage = () =>
    storageClient.getData<RdtState>(key).map((state) => {
      if (state) logger?.debug('readFromStorage')
      return state
    })

  const writeStateToStorage = (value: RdtState) => {
    return storageClient
      .setData(
        key,
        produce(value, (draft) => {
          draft.walletData.proofs = []
        })
      )
      .map(() => {
        logger?.trace('writeToStorage', value)
      })
  }

  const setState = (state: Partial<RdtState>) => {
    const { walletData, sharedData, loggedInTimestamp } = state
    if (walletData && !isEqual(subjects.walletData.value, walletData)) {
      subjects.walletData.next(walletData)
    }

    if (sharedData) subjects.sharedData.next(sharedData)
    if (loggedInTimestamp !== undefined)
      subjects.loggedInTimestamp.next(loggedInTimestamp)
  }

  const resetState = () => {
    if (!isEqual(subjects.walletData.value, walletDataDefault)) {
      subjects.walletData.next(walletDataDefault)
    }

    subjects.sharedData.next({})
    subjects.loggedInTimestamp.next('')
  }

  const initializeState = () =>
    readStateFromStorage()
      .andThen((state) => {
        return ResultAsync.fromPromise(
          RdtState.parseAsync(state),
          (error) => error
        )
      })
      .mapErr(() => {
        logger?.debug(`loadedCorruptedStateFromStorage`)
        resetState()
      })
      .map((storedState) => {
        if (storedState) {
          logger?.debug(`initializeStateFromStorage`)
          return setState(
            produce(storedState, (draft) => {
              draft.walletData.persona = draft.walletData.persona ?? undefined
              return draft
            })
          )
        } else {
          logger?.debug(`initializeStateFromDefault`)
          resetState()
        }
      })

  initializeState()

  subscriptions.add(state.pipe(switchMap(writeStateToStorage)).subscribe())

  subscriptions.add(
    state
      .pipe(
        skip(1),
        first(),
        tap(() => {
          subjects.initialized.next(true)
        })
      )
      .subscribe()
  )

  const getState = () => {
    return {
      walletData: subjects.walletData.value,
      sharedData: subjects.sharedData.value,
      loggedInTimestamp: subjects.loggedInTimestamp.value,
    }
  }

  return {
    setState,
    getState,
    walletData$: combineLatest([
      subjects.initialized,
      subjects.walletData,
    ]).pipe(
      debounceTime(1),
      filter(([initialized]) => initialized),
      map(() => subjects.walletData.value)
    ),
    getWalletData: () => subjects.walletData.value,
    state$: subjects.initialized.pipe(
      filter((initialized) => initialized),
      switchMap(() => state)
    ),
    patchState: (state: Partial<RdtState>) => {
      setState({ ...getState(), ...state })
    },
    reset: resetState,
    stateInitialized$: subjects.initialized.asObservable(),
    destroy: () => {
      resetState()
      subscriptions.unsubscribe()
    },
  }
}
