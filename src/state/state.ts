import { Logger } from 'tslog'
import { StateSubjects } from './subjects'
import { StorageProvider } from '../_types'
import { Subscription, filter, first, skip, switchMap, tap } from 'rxjs'
import { removeUndefined } from '../helpers/remove-undefined'
import { ResultAsync } from 'neverthrow'
import { RdtState } from './types'

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

  const readStateFromStorage = () =>
    storageClient.getData<RdtState>(key).map((state) => {
      if (state) logger?.debug('readFromStorage')
      return state
    })

  const writeStateToStorage = (value: RdtState) => {
    return storageClient.setData(key, value).map(() => {
      logger?.trace('writeToStorage', value)
    })
  }

  const setState = (state: Partial<RdtState>) => {
    removeUndefined(state).map((data) => {
      if (Object.keys(data).length)
        subjects.state.next({ ...subjects.state.value, ...data })
    })
  }

  const resetState = () => {
    subjects.state.next({ walletData: {}, sharedData: {} })
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
          return subjects.state.next(storedState)
        } else {
          logger?.debug(`initializeStateFromDefault`)
          resetState()
        }
      })

  initializeState()

  subscriptions.add(
    subjects.state.pipe(switchMap(writeStateToStorage)).subscribe()
  )

  subscriptions.add(
    subjects.state
      .pipe(
        skip(1),
        first(),
        tap(() => {
          subjects.initialized.next(true)
        })
      )
      .subscribe()
  )

  return {
    setState,
    getState: () => subjects.state.value,
    state$: subjects.initialized.pipe(
      filter((initialized) => initialized),
      switchMap(() => subjects.state)
    ),
    reset: resetState,
    stateInitialized$: subjects.initialized.asObservable(),
    destroy: () => {
      resetState()
      subscriptions.unsubscribe()
    },
  }
}
