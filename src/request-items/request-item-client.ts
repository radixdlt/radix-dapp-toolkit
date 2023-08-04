import { RequestItem, RequestStatusTypes } from '@radixdlt/connect-button'
import { map, Subscription, tap } from 'rxjs'
import { Logger } from 'tslog'
import { RequestItemSubjects } from './subjects'
import { errorType } from '@radixdlt/wallet-sdk'
import { StorageProvider } from '../_types'

export type RequestItemClient = ReturnType<typeof RequestItemClient>
export const RequestItemClient = (
  storageKey: string,
  storageClient: StorageProvider,
  input: {
    subjects?: RequestItemSubjects
    logger?: Logger<unknown>
  }
) => {
  const logger = input.logger
  const requestItemIds = new Set<string>()
  const subscriptions = new Subscription()
  const requestsItemStore = new Map<string, RequestItem>()
  const subjects = input.subjects || RequestItemSubjects()
  const requestItemStoreKey = `${storageKey}:requestItemStore`

  storageClient
    .getData<Record<string, RequestItem>>(requestItemStoreKey)
    .map((store) => {
      if (store) {
        Object.keys(store).forEach((key) => {
          requestItemIds.add(key)
          requestsItemStore.set(key, store[key])
        })
      }
      subjects.items.next(getItemsList())
    })

  const emitChange = (
    oldValue: RequestItem | undefined,
    newValue: RequestItem | undefined
  ) => subjects.onChange.next({ oldValue, newValue })

  const createItem = (type: RequestItem['type']): RequestItem => ({
    type,
    status: 'pending',
    timestamp: Date.now(),
    id: crypto.randomUUID(),
    showCancel: true,
  })

  const add = (type: RequestItem['type']) => {
    const item = createItem(type)
    requestsItemStore.set(item.id, item)
    requestItemIds.add(item.id)
    emitChange(undefined, item)
    logger?.trace(`addRequestItem`, {
      id: item.id,
      status: item.status,
    })
    return item
  }

  const remove = (id: string) => {
    if (requestsItemStore.has(id)) {
      const oldValue = requestsItemStore.get(id)!
      requestsItemStore.delete(id)
      requestItemIds.delete(id)
      emitChange(oldValue, undefined)
      logger?.trace(`removeRequestItem`, id)
    }
  }

  const patch = (id: string, partialValue: Partial<RequestItem>) => {
    const item = requestsItemStore.get(id)
    if (item) {
      const updated = {
        ...item,
        ...partialValue,
      } as RequestItem
      requestsItemStore.set(id, updated)
      emitChange(item, updated)
      logger?.trace(`patchRequestItemStatus`, updated)
    }
  }

  const cancel = (id: string) => {
    if (requestsItemStore.has(id)) {
      patch(id, { status: 'fail', error: errorType.canceledByUser })
      logger?.trace(`cancelRequestItem`, id)
    }
  }

  const reset = () => {
    requestsItemStore.clear()
    requestItemIds.clear()
    emitChange(undefined, undefined)
    logger?.trace(`resetRequestItems`)
  }

  const updateStatus = ({
    id,
    status,
    error,
    transactionIntentHash,
  }: {
    id: string
    status: RequestStatusTypes
    error?: string
    transactionIntentHash?: string
  }) => {
    const item = requestsItemStore.get(id)
    if (item) {
      const updated = {
        ...item,
        status,
      } as RequestItem
      if (updated.status === 'fail') {
        updated.error = error!
      }
      if (updated.status === 'success' && updated.type === 'sendTransaction') {
        updated.transactionIntentHash = transactionIntentHash!
      }
      requestsItemStore.set(id, updated)
      emitChange(item, updated)

      logger?.trace(`updateRequestItemStatus`, updated)
    }
  }

  const getIds = () => [...requestItemIds].reverse()

  const getItemsList = () =>
    getIds()
      .map((id) => ({ id, ...requestsItemStore.get(id) }))
      .filter((item): item is RequestItem => !!item)

  subscriptions.add(
    subjects.onChange
      .pipe(
        map(() => getItemsList()),
        tap((items) => subjects.items.next(items)),
        tap(() => {
          const entries = Array.from(requestsItemStore.entries())

          storageClient.setData(
            requestItemStoreKey,
            Object.fromEntries(
              entries.filter(([, value]) => value.status !== 'pending')
            )
          )
        })
      )
      .subscribe()
  )

  return {
    add,
    remove,
    cancel,
    updateStatus,
    patch,
    reset,
    destroy: () => {
      subscriptions.unsubscribe()
    },
    items$: subjects.items.asObservable(),
    change$: subjects.onChange.asObservable(),
  }
}
