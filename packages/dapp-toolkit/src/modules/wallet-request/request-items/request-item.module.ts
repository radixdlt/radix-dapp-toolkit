import {
  RequestStatus,
  type RequestItem,
  type RequestStatusTypes,
} from 'radix-connect-common'
import { Subscription, filter, map, switchMap } from 'rxjs'
import { Logger } from '../../../helpers'
import { ErrorType } from '../../../error'
import { WalletInteraction } from '../../../schemas'
import type { StorageModule } from '../../storage'
import { ResultAsync, errAsync } from 'neverthrow'
import { WalletData } from '../../state'
export type RequestItemModuleInput = {
  logger?: Logger
  providers: { storageModule: StorageModule<RequestItem> }
}
export type RequestItemModule = ReturnType<typeof RequestItemModule>
export const RequestItemModule = (input: RequestItemModuleInput) => {
  const logger = input?.logger?.getSubLogger({ name: 'RequestItemModule' })
  const subscriptions = new Subscription()
  const storageModule = input.providers.storageModule
  const signals = new Map<string, (val: string) => void>()

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

  const add = (
    value: {
      type: RequestItem['type']
      walletInteraction: WalletInteraction
      isOneTimeRequest: boolean
    },
    onSignal?: (signalValue: string) => void,
  ) => {
    const item = createItem(value)
    logger?.debug({
      method: 'addRequestItem',
      item,
    })
    if (onSignal) {
      signals.set(item.interactionId, onSignal)
    }

    return storageModule
      .setItems({ [item.interactionId]: item })
      .map(() => item)
  }

  const maybeGetSignal = (interactionId: string) => {
    if (signals.has(interactionId)) {
      const signal = signals.get(interactionId)
      signals.delete(interactionId)
      return signal
    }
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
    metadata = {},
    walletData,
  }: {
    id: string
    status: RequestStatusTypes
    error?: string
    transactionIntentHash?: string
    walletData?: WalletData
    metadata?: Record<string, string | number | boolean>
  }): ResultAsync<void, { reason: string }> => {
    return storageModule
      .getItemById(id)
      .mapErr(() => ({ reason: 'couldNotReadFromStore' }))
      .andThen((item) => {
        if (item) {
          const updated = {
            ...item,
            walletData,
            status:
              item.status === RequestStatus.ignored ? item.status : status,
            metadata: item.metadata
              ? { ...item.metadata, ...metadata }
              : metadata,
          } as RequestItem

          if (updated.status === 'fail') {
            updated.transactionIntentHash = transactionIntentHash!
            updated.error = error!
          }
          if (
            updated.status === 'success' &&
            updated.type === 'sendTransaction'
          ) {
            updated.transactionIntentHash = transactionIntentHash!
          }
          if (
            ['success', 'fail', 'ignored', 'cancelled'].includes(updated.status)
          ) {
            delete updated.walletInteraction
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
    maybeGetSignal,
    getById: (id: string) => storageModule.getItemById(id),
    getPending,
    requests$,
    clear: storageModule.clear,
    destroy: () => {
      subscriptions.unsubscribe()
    },
  }
}
