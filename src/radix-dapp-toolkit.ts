import { Providers } from './_types'
import { StateClient } from './state/state'
import { ConnectButtonClient } from './connect-button/connect-button-client'
import { WalletClient } from './wallet/wallet-client'
import { AppLogger, Metadata, SdkError, WalletSdk } from '@radixdlt/wallet-sdk'
import { GatewayApiClient } from './gateway/gateway-api'
import { getGatewayBaseUrlByNetworkId } from './gateway/helpers/get-gateway-url'
import { GatewayClient } from './gateway/gateway'
import {
  EMPTY,
  Subject,
  Subscription,
  delay,
  first,
  firstValueFrom,
  merge,
  switchMap,
  tap,
} from 'rxjs'
import {
  ConnectButtonDataRequestInput,
  DataRequestInput,
  DataRequestOutput,
  RdtState,
  rdtStateDefault,
} from './io/schemas'
import { ResultAsync, errAsync, okAsync } from 'neverthrow'
import { RequestItemClient } from './request-items/request-item-client'
import { LocalStorageClient } from './storage/local-storage-client'
import {
  RequestWalletData,
  requestWalletDataFactory,
} from './wallet/request-wallet-data'

export type RadixDappToolkitOptions = Partial<{
  logger: AppLogger
  onInit: (state: RdtState) => void
  onDisconnect: () => void
  explorer: {
    baseUrl: string
    transactionPath: string
    accountsPath: string
  }
  gatewayBaseUrl: string
  onStateChange: (state: RdtState) => void
  providers: Partial<Providers>
  useCache: boolean
}>

export type RadixDappToolkit = ReturnType<typeof RadixDappToolkit>

export const RadixDappToolkit = (
  { dAppDefinitionAddress, networkId }: Omit<Metadata, 'version'>,
  onConnect?: (
    value: (
      input: ConnectButtonDataRequestInput
    ) => ResultAsync<DataRequestOutput, SdkError>
  ) => void | boolean | Promise<void | boolean>,
  options?: RadixDappToolkitOptions
) => {
  const {
    providers,
    logger,
    onDisconnect,
    explorer,
    gatewayBaseUrl,
    useCache = true,
  } = options || {}

  const storageKey = `rdt:${dAppDefinitionAddress}:${networkId}`
  const WalletInteractionDataFormatVersion = 1
  const updateSharedDataSubject = new Subject<void>()
  const subscriptions = new Subscription()

  const connectButtonClient =
    providers?.connectButton ||
    ConnectButtonClient({ logger, dAppName: '', explorer })

  const gatewayClient =
    providers?.gatewayClient ||
    GatewayClient({
      logger,
      gatewayApi: GatewayApiClient(
        gatewayBaseUrl ?? getGatewayBaseUrlByNetworkId(networkId)
      ),
    })

  const walletSdk =
    providers?.walletSdk ??
    WalletSdk({
      networkId,
      dAppDefinitionAddress,
      logger,
      version: WalletInteractionDataFormatVersion,
    })

  const requestItemClient =
    providers?.requestItemClient ||
    RequestItemClient({
      logger,
    })

  const walletClient =
    providers?.walletClient ||
    WalletClient({
      logger,
      onCancelRequestItem$: connectButtonClient.onCancelRequestItem$,
      walletSdk,
      gatewayClient,
      requestItemClient,
    })

  const storageClient = providers?.storageClient || LocalStorageClient()

  const stateClient =
    providers?.stateClient ||
    StateClient(storageKey, storageClient, {
      logger,
    })

  const requestWalletData = requestWalletDataFactory(
    requestItemClient,
    walletClient,
    stateClient,
    useCache
  )

  subscriptions.add(
    stateClient.state$
      .pipe(
        first(),
        delay(1),
        tap((state) => {
          options?.onInit?.(state)
        })
      )
      .subscribe()
  )

  subscriptions.add(
    stateClient.state$
      .pipe(tap((state) => options?.onStateChange?.(state)))
      .subscribe()
  )

  const handleWalletDataRequest = (
    done: boolean | void | Promise<boolean | void>,
    unresolvedWalletResponse: RequestWalletData
  ): ResultAsync<DataRequestOutput, SdkError> => {
    const doneResult =
      done instanceof Promise
        ? ResultAsync.fromPromise(done, (error) => error)
        : okAsync(done)

    return ResultAsync.combine([unresolvedWalletResponse, doneResult])
      .mapErr((err) => {
        if (err.error === 'invalidPersona')
          stateClient.setState(rdtStateDefault)
        return err
      })
      .map(([walletResponse]): DataRequestOutput => walletResponse)
  }

  if (onConnect)
    subscriptions.add(
      connectButtonClient.onConnect$
        .pipe(
          tap(() => {
            stateClient.setState(rdtStateDefault)
            const resolved = new Subject<RequestWalletData>()
            return handleWalletDataRequest(
              onConnect((data) =>
                requestWalletData({ isConnect: true, data })
                  .map((walletResponse) => {
                    resolved.next(okAsync(walletResponse))
                    return walletResponse
                  })
                  .mapErr((error) => {
                    resolved.next(errAsync(error))
                    return error
                  })
              ),
              ResultAsync.fromSafePromise(firstValueFrom(resolved)).andThen(
                (result) => result
              )
            )
          })
        )
        .subscribe()
    )

  subscriptions.add(
    connectButtonClient.onDisconnect$
      .pipe(
        tap(() => {
          stateClient.reset()
          walletClient.resetRequestItems()
          if (onDisconnect) onDisconnect()
        })
      )
      .subscribe()
  )

  subscriptions.add(
    stateClient.state$
      .pipe(
        tap((state) => {
          connectButtonClient.setAccounts(state.walletData.accounts ?? [])
          connectButtonClient.setPersonaData(state.walletData.personaData ?? [])
          connectButtonClient.setPersonaLabel(
            state.walletData?.persona?.label ?? ''
          )
          connectButtonClient.setConnected(state.connected)
        })
      )
      .subscribe()
  )

  subscriptions.add(
    walletClient.requestItems$
      .pipe(
        tap((items) => {
          connectButtonClient.setRequestItems(items)
          connectButtonClient.setConnecting(
            items.some(
              (item) =>
                item.status === 'pending' && item.type === 'loginRequest'
            )
          )
          connectButtonClient.setLoading(
            items.some((item) => item.status === 'pending')
          )
        })
      )
      .subscribe()
  )

  subscriptions.add(
    merge(connectButtonClient.onUpdateSharedData$, updateSharedDataSubject)
      .pipe(
        switchMap(() => {
          const data: DataRequestInput = {}
          const state = stateClient.getState()

          if (state.sharedData?.ongoingAccounts)
            data['accounts'] = {
              ...state.sharedData.ongoingAccounts,
              reset: true,
              oneTime: false,
            }

          if (state.sharedData?.ongoingPersonaData)
            data['personaData'] = {
              ...state.sharedData.ongoingPersonaData,
              reset: true,
              oneTime: false,
            }

          if (Object.keys(data).length === 0) return EMPTY

          return requestWalletData({ isConnect: false, data })
        })
      )
      .subscribe()
  )

  return {
    requestData: (
      data: DataRequestInput
    ): ResultAsync<DataRequestOutput, SdkError> =>
      handleWalletDataRequest(
        undefined,
        requestWalletData({ isConnect: false, data })
      ),
    sendTransaction: walletClient.sendTransaction,
    updateSharedData: () => {
      updateSharedDataSubject.next()
    },
    gatewayApi: gatewayClient.gatewayApi,
    state$: stateClient.state$,
    disconnect: () => {
      walletClient.resetRequestItems()
      stateClient.reset()
    },
    destroy: () => {
      stateClient.destroy()
      walletClient.destroy()
      subscriptions.unsubscribe()
      connectButtonClient.destroy()
    },
  }
}
