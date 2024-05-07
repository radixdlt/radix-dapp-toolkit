import { err, Ok, ok, Result, ResultAsync } from 'neverthrow'
import { typedError } from '../helpers/typed-error'
import { parseJSON } from '../helpers/parse-json'
import { filter, fromEvent, map, merge, mergeMap, of } from 'rxjs'
import { stringify } from '../helpers'

type NetworkId = number
type PartitionKey =
  | 'sessions'
  | 'identities'
  | 'requests'
  | 'state'
  | 'connectButtonStatus'
type dAppDefinitionAddress = string

export type StorageChange<T> = {
  key: string
  partition: string
  newValue: Record<string, T> | undefined
  oldValue: Record<string, T> | undefined
}

export type StorageProvider<T extends object = any> = ReturnType<
  typeof LocalStorageClient<T>
>

export const LocalStorageClient = <T extends object = any>(
  key: `rdt:${dAppDefinitionAddress}:${NetworkId}`,
  partitionKey?: PartitionKey,
) => {
  const storageKey = partitionKey ? `${key}:${partitionKey}` : key

  const getDataAsync = (): Promise<string | null> =>
    new Promise((resolve, reject) => {
      try {
        resolve(localStorage.getItem(storageKey))
      } catch (error) {
        reject(error)
      }
    })

  const setDataAsync = (value: string): Promise<void> =>
    new Promise((resolve, reject) => {
      try {
        localStorage.setItem(storageKey, value)
        resolve()
      } catch (error) {
        reject(error)
      }
    })

  const getItems = (): ResultAsync<Record<string, T>, Error> =>
    ResultAsync.fromPromise(getDataAsync(), typedError).andThen((data) =>
      data ? parseJSON(data) : ok({}),
    )

  const getItemById = (id: string): ResultAsync<T | undefined, Error> =>
    ResultAsync.fromPromise(getDataAsync(), typedError)
      .andThen((data) => (data ? parseJSON(data) : ok(undefined)))
      .map((items) => (items ? items[id] : undefined))

  const removeItemById = (id: string): ResultAsync<void, Error> =>
    getItems().andThen((items) => {
      const { [id]: _, ...newItems } = items
      return setItems(newItems)
    })

  const patchItem = (id: string, patch: Partial<T>): ResultAsync<void, Error> =>
    getItemById(id).andThen((item) => {
      return item
        ? setItems({ [id]: { ...item, ...patch } })
        : err(new Error('Item not found'))
    })

  const setItems = (item: Record<string, T>): ResultAsync<void, Error> =>
    getItems().andThen((data) =>
      stringify({ ...data, ...item }).asyncAndThen((serialized) => {
        const result = ResultAsync.fromPromise(
          setDataAsync(serialized),
          typedError,
        ).map(() => {
          window.dispatchEvent(
            new StorageEvent('storage', {
              key: storageKey,
              oldValue: JSON.stringify(data),
              newValue: serialized,
            }),
          )
        })
        return result
      }),
    )

  const getItemList = (): ResultAsync<T[], Error> =>
    getItems().map(Object.values)

  const getState = (): ResultAsync<T | undefined, Error> =>
    ResultAsync.fromPromise(getDataAsync(), typedError).andThen((data) =>
      data ? parseJSON<T>(data) : ok(undefined),
    )

  const setState = (newValue: T): ResultAsync<void, Error> =>
    getState().andThen((oldValue) =>
      stringify({ ...(oldValue ?? {}), ...newValue }).asyncAndThen(
        (serialized) => {
          const result = ResultAsync.fromPromise(
            setDataAsync(serialized),
            typedError,
          ).map(() => {
            window.dispatchEvent(
              new StorageEvent('storage', {
                key: storageKey,
                oldValue: JSON.stringify(oldValue),
                newValue: serialized,
              }),
            )
          })
          return result
        },
      ),
    )

  const patchState = (
    newValue: Partial<T>,
  ): ResultAsync<void, { reason: string }> =>
    getState()
      .mapErr(() => ({ reason: 'FailedToReadFromLocalStorage' }))
      .andThen((oldState) =>
        oldState
          ? setState({ ...oldState, ...newValue }).mapErr(() => ({
              reason: 'FailedToWriteToLocalStorage',
            }))
          : err({ reason: 'PatchingStateFailed' }),
      )

  const getPartition = (partitionKey: PartitionKey) =>
    LocalStorageClient<T>(key, partitionKey)

  const storage$ = merge(
    fromEvent<StorageEvent>(window, 'storage'),
    of({ key: storageKey, newValue: null, oldValue: null }),
  ).pipe(
    filter((item) => item.key === storageKey),
    mergeMap((event) => {
      const { key, newValue, oldValue } = event

      if (!key) return []

      const [rdt, accountDefinition, networkId, partition] = key.split(':')

      if (rdt === 'rdt' && accountDefinition && networkId) {
        const oldValueResult = oldValue ? parseJSON(oldValue) : ok(undefined)
        const newValueResult = newValue ? parseJSON(newValue) : ok(undefined)

        return [
          Result.combine([oldValueResult, newValueResult]).map(
            ([oldValue, newValue]) => ({
              key,
              partition,
              newValue,
              oldValue,
            }),
          ),
        ]
      }
      return []
    }),
    filter((result): result is Ok<StorageChange<T>, never> => result.isOk()),
    map(({ value }) => value),
  )

  return {
    getItems,
    getItemById,
    removeItemById,
    patchItem,
    setItems,
    getItemList,
    getPartition,
    setState,
    getState,
    patchState,
    clear: () => localStorage.removeItem(storageKey),
    storage$,
  }
}
