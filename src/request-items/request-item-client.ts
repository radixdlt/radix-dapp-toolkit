import { RequestItem, RequestStatusTypes } from '@radixdlt/connect-button'
import { map, Subscription, tap } from 'rxjs'
import { Logger } from 'tslog'
import { RequestItemSubjects } from './subjects'

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

  const reset = () => {
    requestsItemStore.clear()
    requestItemIds.clear()
    subjects.onChange.next()
    logger?.debug(`resetRequestItems`)
  }

  const updateStatus = (
    id: string,
    status: RequestStatusTypes,
    error?: string
  ) => {
    const item = requestsItemStore.get(id)
    if (item) {
      const updated = {
        ...item,
        status,
      } as RequestItem
      if (updated.status === 'fail') {
        updated.error = error!
      }
      requestsItemStore.set(id, updated)
      subjects.onChange.next()
      logger?.debug(`updateRequestItemStatus`, { id, status, error })
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
    updateStatus,
    reset,
    destroy: () => {
      subscriptions.unsubscribe()
    },
    items$: subjects.items.asObservable(),
    subjects,
  }
}
