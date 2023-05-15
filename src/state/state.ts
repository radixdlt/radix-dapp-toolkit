import { Logger } from 'tslog'
import { StateSubjects } from './subjects'
import { StorageProvider } from '../_types'
import { Subscription, switchMap } from 'rxjs'
import { removeUndefined } from '../helpers/remove-undefined'
import { RdtState, rdtStateDefault } from '../io/schemas'
import { ResultAsync } from 'neverthrow'

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
    subjects.state.next(rdtStateDefault)
  }

  const initializeState = () =>
    readStateFromStorage()
      .andThen((state) =>
        ResultAsync.fromPromise(RdtState.parseAsync(state), (error) => error)
      )
      .mapErr(() => {
        logger?.debug(`loadedCorruptedStateFromStorage`)
        subjects.state.next(rdtStateDefault)
      })
      .map((storedState) => {
        if (storedState) {
          logger?.debug(`initializeStateFromStorage`)
          return subjects.state.next(storedState)
        } else {
          logger?.debug(`initializeStateFromDefault`)
          return subjects.state.next(rdtStateDefault)
        }
      })

  initializeState()

  subscriptions.add(
    subjects.state.pipe(switchMap(writeStateToStorage)).subscribe()
  )

  return {
    setState,
    getState: () => subjects.state.value,
    state$: subjects.state.asObservable(),
    reset: resetState,
    destroy: () => {
      resetState()
      subscriptions.unsubscribe()
    },
  }
}
