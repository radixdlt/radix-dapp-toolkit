import { err, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import { validateWalletResponse, type Logger } from '../../../helpers'
import type { WalletInteractionResponse } from '../../../schemas'
import type { StorageModule } from '../../storage'
import type { RequestItemModule } from '../request-items'
import { SdkError } from '../../../error'
import { filter, firstValueFrom, map } from 'rxjs'
import { WalletResponseResolver } from './type'
import { RequestItem } from 'radix-connect-common'

export type RequestResolverModule = ReturnType<typeof RequestResolverModule>
export const RequestResolverModule = (input: {
  logger?: Logger
  providers: {
    storageModule: StorageModule
    requestItemModule: RequestItemModule
    resolvers: WalletResponseResolver[]
  }
}) => {
  const WAIT_TIME = 1_000
  const { providers } = input
  const { requestItemModule, storageModule, resolvers } = providers
  const logger = input.logger?.getSubLogger({ name: 'RequestResolverModule' })

  let shouldRun = true

  const walletResponses: StorageModule<WalletInteractionResponse> =
    storageModule.getPartition('walletResponses')

  const getPendingRequests = () =>
    requestItemModule
      .getPending()
      .orElse((error) => {
        logger?.error({ method: 'getPendingRequests', error })
        return ok([])
      })
      .andThen((pendingItems) =>
        pendingItems.length === 0
          ? err('PendingItemsNotFound')
          : ok(pendingItems),
      )

  const getPendingRequestById = (interactionId: string) =>
    requestItemModule
      .getById(interactionId)
      .mapErr(() => SdkError('FailedToGetPendingItems', interactionId))
      .andThen((pendingItem) =>
        pendingItem?.status === 'pending'
          ? ok(pendingItem)
          : err(SdkError('PendingItemNotFound', interactionId)),
      )

  const getWalletResponseById = (
    interactionId: string,
  ): ResultAsync<WalletInteractionResponse | undefined, SdkError> =>
    requestItemModule
      .getById(interactionId)
      .mapErr(() => SdkError('FailedToGetWalletResponse', interactionId))
      .map((item) => item?.walletResponse)

  const markRequestAsSent = (interactionId: string) =>
    requestItemModule.patch(interactionId, { sentToWallet: true })

  const addWalletResponses = (responses: WalletInteractionResponse[]) =>
    Result.combine(responses.map(validateWalletResponse))
      .asyncAndThen(() =>
        walletResponses.setItems(
          responses.reduce<Record<string, WalletInteractionResponse>>(
            (acc, response) => {
              acc[response.interactionId] = response
              return acc
            },
            {},
          ),
        ),
      )
      .mapErr((error) => logger?.error({ method: 'addWalletResponses', error }))

  const toRequestItemMap = (items: RequestItem[]) =>
    items.reduce<Record<string, RequestItem>>(
      (acc, item) => ({ ...acc, [item.interactionId]: item }),
      {},
    )

  const matchRequestItemToResponses = (
    requestItems: Record<string, RequestItem>,
  ) => {
    const ids = Object.keys(requestItems)
    return walletResponses
      .getItemList()
      .map((responses) =>
        responses.filter((response) => ids.includes(response.interactionId)),
      )
      .andThen((responses) =>
        responses.length ? ok(responses) : err('WalletResponsesNotFound'),
      )
      .map((responses) =>
        responses.map((response) => ({
          walletInteractionResponse: response,
          requestItem: requestItems[response.interactionId],
        })),
      )
  }

  const resolveRequests = (
    unresolvedRequests: {
      walletInteractionResponse: WalletInteractionResponse
      requestItem: RequestItem
    }[],
  ) =>
    ResultAsync.combine(unresolvedRequests.map(resolveRequest)).map(
      () => unresolvedRequests,
    )

  // Remove data from RequestItem and WalletResponse that is no longer needed
  const cleanup = (requestItems: RequestItem[]) => {
    return okAsync(undefined)
  }

  const resolveRequest = ({
    requestItem,
    walletInteractionResponse,
  }: {
    walletInteractionResponse: WalletInteractionResponse
    requestItem: RequestItem
  }) => {
    const { walletInteraction } = requestItem

    return ResultAsync.combine(
      resolvers.map((resolver) =>
        resolver({ walletInteraction, walletInteractionResponse, requestItem }),
      ),
    )
  }

  const waitForWalletResponse = (interactionId: string) =>
    ResultAsync.fromSafePromise(
      firstValueFrom(
        requestItemModule.requests$.pipe(
          filter((items) =>
            items.some(
              (item) =>
                item.interactionId === interactionId &&
                item.status !== 'pending',
            ),
          ),
          map(
            (items) =>
              items.find((item) => item.interactionId === interactionId)!,
          ),
        ),
      ),
    )

  const requestResolverLoop = async () => {
    await getPendingRequests()
      .map(toRequestItemMap)
      .andThen(matchRequestItemToResponses)
      .andThen(resolveRequests)
      .map((unresolvedRequests) =>
        unresolvedRequests.map((item) => item.requestItem),
      )
      .andThen(cleanup)

    await new Promise((resolve) => setTimeout(resolve, WAIT_TIME))

    if (shouldRun) requestResolverLoop()
  }

  requestResolverLoop()

  return {
    waitForWalletResponse,
    getPendingRequestById,
    getPendingRequestIds: () =>
      getPendingRequests().map((items) =>
        items.map((item) => item.interactionId),
      ),
    markRequestAsSent,
    addWalletResponses,
    getWalletResponseById,
    destroy: () => {
      shouldRun = false
    },
  }
}
