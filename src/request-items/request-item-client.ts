import { RequestItem, RequestStatusTypes } from '@radixdlt/connect-button'
import { map, Subscription, tap } from 'rxjs'
import { Logger } from 'tslog'
import { RequestItemSubjects } from './subjects'
import { errorType } from '@radixdlt/wallet-sdk'

export type RequestItemClient = ReturnType<typeof RequestItemClient>
export const RequestItemClient = (input: {
  subjects?: RequestItemSubjects
  logger?: Logger<unknown>
}) => {
  const logger = input.logger
  const requestsItemStore = new Map<string, RequestItem>()
  const requestItemIds = new Set<string>()
  const subscriptions = new Subscription()
  const subjects = input.subjects || RequestItemSubjects()

  const createItem = (type: RequestItem['type']): RequestItem => ({
    type,
    status: 'pending',
    id: crypto.randomUUID(),
    showCancel: true,
  })

  const add = (type: RequestItem['type']) => {
    const item = createItem(type)
    requestsItemStore.set(item.id, item)
    requestItemIds.add(item.id)
    subjects.onChange.next()
    logger?.debug(`addRequestItem`, {
      id: item.id,
      status: item.status,
    })
    return item
  }

  const remove = (id: string) => {
    if (requestsItemStore.has(id)) {
      requestsItemStore.delete(id)
      requestItemIds.delete(id)
      subjects.onChange.next()
      logger?.debug(`removeRequestItem`, id)
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
      subjects.onChange.next()
      logger?.debug(`patchRequestItemStatus`, updated)
    }
  }

  const cancel = (id: string) => {
    if (requestsItemStore.has(id)) {
      patch(id, { status: 'fail', error: errorType.canceledByUser })
      logger?.debug(`cancelRequestItem`, id)
    }
  }

  const reset = () => {
    requestsItemStore.clear()
    requestItemIds.clear()
    subjects.onChange.next()
    logger?.debug(`resetRequestItems`)
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
      subjects.onChange.next()
      logger?.debug(`updateRequestItemStatus`, updated)
    }
  }

  const getIds = () => [...requestItemIds]

  const getItemsList = () =>
    getIds()
      .map((id) => ({ id, ...requestsItemStore.get(id) }))
      .filter((item): item is RequestItem => !!item)

  subscriptions.add(
    subjects.onChange
      .pipe(
        map(() => getItemsList()),
        tap((items) => subjects.items.next(items))
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
    subjects,
  }
}
