import type { RequestItem, RequestStatusTypes } from 'radix-connect-common'
import { Subscription } from 'rxjs'
import { RequestItemSubjects } from './subjects'
import { Logger } from '../../helpers'
import { ErrorType } from '../../error'
import { WalletInteraction } from '../../schemas'
import { StorageProvider } from '../../storage'
import { ResultAsync, errAsync } from 'neverthrow'
export type RequestItemClientInput = {
  logger?: Logger
  subjects?: RequestItemSubjects
  providers: { storageClient: StorageProvider<RequestItem> }
}
export type RequestItemClient = ReturnType<typeof RequestItemClient>
export const RequestItemClient = (input: RequestItemClientInput) => {
  const logger = input?.logger?.getSubLogger({ name: 'RequestItemClient' })
  const subscriptions = new Subscription()
  const subjects = input.subjects || RequestItemSubjects()
  const storageClient = input.providers.storageClient

 storageClient.getItemList().map((items) => {
   logger?.debug({ method: 'initRequestItems', items })
   subjects.items.next(items)
 })

  const createItem = ({
    type,
    walletInteraction,
    isOneTimeRequest,
  }: {
    type: RequestItem['type']
    walletInteraction: WalletInteraction
    isOneTimeRequest: boolean
  }): RequestItem => ({
    type,
    status: 'pending',
    createdAt: Date.now(),
    interactionId: walletInteraction.interactionId,
    showCancel: true,
    walletInteraction,
    isOneTimeRequest,
  })

  const add = (value: {
    type: RequestItem['type']
    walletInteraction: WalletInteraction
    isOneTimeRequest: boolean
  }) => {
    const item = createItem(value)
    logger?.debug({
      method: 'addRequestItem',
      item,
    })
    return storageClient
      .setItems({ [item.interactionId]: item })
      .map(() => item)
  }

  const patch = (id: string, partialValue: Partial<RequestItem>) => {
    logger?.debug({
      method: 'patchRequestItemStatus',
      item: { id, ...partialValue },
    })
    return storageClient.patchItem(id, partialValue)
  }

  const cancel = (id: string) => {
    logger?.debug({ method: 'cancelRequestItem', id })
    return patch(id, { status: 'fail', error: ErrorType.canceledByUser })
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
  }): ResultAsync<void, { reason: string }> => {
    return storageClient
      .getItemById(id)
      .mapErr(() => ({ reason: 'couldNotReadFromStore' }))
      .andThen((item) => {
        if (item) {
          const updated = {
            ...item,
            status,
          } as RequestItem
          if (updated.status === 'fail') {
            updated.error = error!
          }
          if (
            updated.status === 'success' &&
            updated.type === 'sendTransaction'
          ) {
            updated.transactionIntentHash = transactionIntentHash!
          }
          logger?.debug({ method: 'updateRequestItemStatus', updated })
          return storageClient
            .setItems({ [id]: updated })
            .mapErr(() => ({ reason: 'couldNotWriteToStore' }))
        }
        return errAsync({ reason: 'itemNotFound' })
      })
  }

  const getPendingItems = () =>
    storageClient
      .getItems()
      .map((items) =>
        Object.values(items).filter((item) => !item.walletResponse),
      )

  return {
    add,
    cancel,
    updateStatus,
    patch,
    getById: (id: string) => storageClient.getItemById(id),
    getPendingItems,
    store: storageClient,
    destroy: () => {
      subscriptions.unsubscribe()
    },
  }
}
