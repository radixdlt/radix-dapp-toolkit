import { ResultAsync } from 'neverthrow'
import { RequestItem, RequestStatus } from 'radix-connect-common'
import { Logger } from '../../../helpers'
import { GatewayModule } from '../../gateway'
import { RequestItemModule } from '../request-items'
import { Subject, Subscription, tap } from 'rxjs'

type ActivePolling = ReturnType<GatewayModule['pollSubintentStatus']>

export type PreauthorizationPollingModuleInput = {
  logger?: Logger
  providers: {
    gatewayModule: GatewayModule
    requestItemModule: RequestItemModule
    ignoreTransactionSubject: Subject<string>
  }
}
export type PreauthorizationPollingModule = ReturnType<
  typeof PreauthorizationPollingModule
>
export const PreauthorizationPollingModule = (
  input: PreauthorizationPollingModuleInput,
) => {
  const logger = input?.logger?.getSubLogger({
    name: 'PreauthorizationPolling',
  })
  const {
    providers: { requestItemModule, ignoreTransactionSubject },
  } = input
  let shouldRun = true
  const WAIT_TIME = 1_000
  const activePolling = new Map<string, ActivePolling>()
  const subscriptions = new Subscription()

  subscriptions.add(
    ignoreTransactionSubject
      .pipe(
        tap((id) => {
          if (activePolling.has(id)) {
            activePolling.get(id)?.stop()
            activePolling.delete(id)
          }
        }),
      )
      .subscribe(),
  )

  const preauthorizationPollingLoop = async () => {
    await requestItemModule.getPendingCommit().andThen((lookedUpItems) => {
      const timedOutItems: RequestItem[] = []
      const lookupItems: RequestItem[] = []

      lookedUpItems.forEach((item) => {
        if (Number(item.metadata?.expirationTimestamp) * 1000 < Date.now()) {
          timedOutItems.push(item)
        } else {
          lookupItems.push(item)
        }
      })

      lookupItems.forEach((item) => {
        if (!activePolling.has(item.interactionId)) {
          const polling = input.providers.gatewayModule.pollSubintentStatus(
            item.transactionIntentHash!,
            item.metadata?.expirationTimestamp as number,
          )
          activePolling.set(item.interactionId, polling)
          polling.result
            .andTee((result) =>
              requestItemModule.updateStatus({
                id: item.interactionId,
                status: RequestStatus.success,
                metadata: {
                  parentTransactionIntentHash: result.transactionIntentHash,
                },
              }),
            )
            .mapErr(() => {
              activePolling.delete(item.interactionId)
            })
        }
      })

      return ResultAsync.combine(
        timedOutItems.map((item) => {
          if (activePolling.has(item.interactionId)) {
            activePolling.get(item.interactionId)?.stop()
            activePolling.delete(item.interactionId)
          }
          return requestItemModule.updateStatus({
            id: item.interactionId,
            status: RequestStatus.timedOut,
          })
        }),
      )
    })

    await new Promise((resolve) => setTimeout(resolve, WAIT_TIME))
    if (shouldRun) preauthorizationPollingLoop()
  }

  preauthorizationPollingLoop()

  return {
    destroy: () => {
      shouldRun = false
      subscriptions.unsubscribe()
    },
  }
}
