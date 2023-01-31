import { map, Subscription, tap } from 'rxjs'
import { Logger } from 'tslog'
import { removeUndefined } from '../helpers/remove-undefined'
import { RequestItem, RequestStatus, WalletRequest } from '../_types'
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

  const createItem = (value: WalletRequest): RequestItem => ({
    ...value,
    status: 'pending',
  })

  const add = (input: WalletRequest) => {
    const itemId = crypto.randomUUID()
    removeUndefined(input).map((data) => {
      const item = createItem(data)
      requestsItemStore.set(itemId, item)
      requestItemIds.add(itemId)
      subjects.onChange.next()
      logger?.debug(`addRequestItem`, {
        id: itemId,
        status: item.status,
      })
    })
    return itemId
  }

  const remove = (id: string) => {
    if (requestsItemStore.has(id)) {
      requestsItemStore.delete(id)
      requestItemIds.delete(id)
      subjects.onChange.next()
      logger?.debug(`removeRequestItem`, id)
    }
  }

  const updateStatus = (id: string, status: RequestStatus) => {
    const item = requestsItemStore.get(id)
    if (item) {
      const updated = {
        ...item,
        status,
      }
      requestsItemStore.set(id, updated)
      subjects.onChange.next()
      logger?.debug(`updateRequestItemStatus`, { id, status })
    }
  }

  const getIds = () => [...requestItemIds]

  const getItemsList = () =>
    getIds()
      .map((id) => ({ id, ...requestsItemStore.get(id) }))
      .filter((item): item is RequestItem & { id: string } => !!item)

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
    destroy: () => {
      subscriptions.unsubscribe()
    },
    items$: subjects.items.asObservable(),
    subjects,
  }
}
