import type { RequestItem, RequestStatusTypes } from 'radix-connect-common'
import { Subscription, filter, map, switchMap } from 'rxjs'
import { Logger } from '../../../helpers'
import { ErrorType } from '../../../error'
import { WalletInteraction } from '../../../schemas'
import type { StorageModule } from '../../storage'
import { ResultAsync, errAsync } from 'neverthrow'
export type RequestItemModuleInput = {
  logger?: Logger
  providers: { storageModule: StorageModule<RequestItem> }
}
export type RequestItemModule = ReturnType<typeof RequestItemModule>
export const RequestItemModule = (input: RequestItemModuleInput) => {
  const logger = input?.logger?.getSubLogger({ name: 'RequestItemModule' })
  const subscriptions = new Subscription()
  const storageModule = input.providers.storageModule

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
    return storageModule
      .setItems({ [item.interactionId]: item })
      .map(() => item)
  }

  const patch = (id: string, partialValue: Partial<RequestItem>) => {
    logger?.debug({
      method: 'patchRequestItemStatus',
      item: { id, ...partialValue },
    })
    return storageModule.patchItem(id, partialValue)
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
    return storageModule
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
          return storageModule
            .setItems({ [id]: updated })
            .mapErr(() => ({ reason: 'couldNotWriteToStore' }))
        }
        return errAsync({ reason: 'itemNotFound' })
      })
  }

  const getPending = () =>
    storageModule
      .getItemList()
      .map((items) => items.filter((item) => item.status === 'pending'))

  const requests$ = storageModule.storage$.pipe(
    switchMap(() => storageModule.getItemList()),
    map((result) => {
      if (result.isOk()) return result.value
    }),
    filter((items): items is RequestItem[] => !!items),
  )

  return {
    add,
    cancel,
    updateStatus,
    patch,
    getById: (id: string) => storageModule.getItemById(id),
    getPending,
    requests$,
    clear: storageModule.clear,
    destroy: () => {
      subscriptions.unsubscribe()
    },
  }
}
