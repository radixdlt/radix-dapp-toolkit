import { WalletRequestSdk } from './wallet-request-sdk'
import {
  Subject,
  Subscription,
  filter,
  firstValueFrom,
  map,
  merge,
  mergeMap,
  of,
  switchMap,
  tap,
} from 'rxjs'
import type { GatewayClient } from '../gateway/gateway'
import { RequestItemClient } from './request-items/request-item-client'
import type { Logger } from '../helpers'
import { TransactionStatus } from '../gateway/types'
import { Result, ResultAsync, err, ok, okAsync } from 'neverthrow'
import {
  MessageLifeCycleEvent,
  WalletInteraction,
  WalletInteractionResponse,
} from '../schemas'
import { SdkError } from '../error'
import {
  DataRequestBuilderItem,
  DataRequestState,
  DataRequestStateClient,
  canDataRequestBeResolvedByRdtState,
  toWalletRequest,
  transformSharedDataToDataRequestState,
  transformWalletRequestToSharedData,
  transformWalletResponseToRdtWalletData,
} from './data-request'
import { StorageProvider } from '../storage'
import { StateClient, WalletData } from '../state'
import {
  AwaitedWalletDataRequestResult,
  TransportProvider,
  WalletDataRequestResult,
} from '../_types'
import { ConnectorExtensionClient } from './transport'
import { RequestItem } from 'radix-connect-common'

type SendTransactionInput = {
  transactionManifest: string
  version?: number
  blobs?: string[]
  message?: string
  onTransactionId?: (transactionId: string) => void
}

export type WalletRequestClient = ReturnType<typeof WalletRequestClient>
export const WalletRequestClient = (input: {
  logger?: Logger
  origin?: string
  networkId: number
  useCache: boolean
  requestInterceptor?: (input: WalletInteraction) => Promise<WalletInteraction>
  dAppDefinitionAddress: string
  providers: {
    stateClient: StateClient
    storageClient: StorageProvider
    gatewayClient: GatewayClient
    transports?: TransportProvider[]
    dataRequestStateClient?: DataRequestStateClient
    requestItemClient?: RequestItemClient
    walletRequestSdk?: WalletRequestSdk
  }
}) => {
  const useCache = input.useCache
  const networkId = input.networkId
  const cancelRequestSubject = new Subject<string>()
  const interactionStatusChangeSubject = new Subject<'fail' | 'success'>()
  const gatewayClient = input.providers.gatewayClient
  const dAppDefinitionAddress = input.dAppDefinitionAddress
  const logger = input.logger?.getSubLogger({ name: 'WalletRequestClient' })

  const stateClient = input.providers.stateClient
  const storageClient = input.providers.storageClient

  const dataRequestStateClient =
    input.providers.dataRequestStateClient ?? DataRequestStateClient({})

  const requestItemClient =
    input.providers.requestItemClient ??
    RequestItemClient({
      logger,
      providers: {
        storageClient: storageClient.getPartition('requests'),
      },
    })

  const transports = input.providers.transports ?? [
    ConnectorExtensionClient({
      logger,
      providers: { requestItemClient },
    }),
  ]

  const walletRequestSdk =
    input.providers.walletRequestSdk ??
    WalletRequestSdk({
      logger,
      networkId,
      origin: input.origin,
      dAppDefinitionAddress,
      requestInterceptor: input.requestInterceptor,
      providers: { transports },
    })

  const cancelRequestControl = (id: string) => {
    const messageLifeCycleEvent = new Subject<
      MessageLifeCycleEvent['eventType']
    >()
    return {
      eventCallback: (event) => {
        messageLifeCycleEvent.next(event)
      },
      requestControl: ({ cancelRequest, getRequest }) => {
        firstValueFrom(
          messageLifeCycleEvent.pipe(
            filter((event) => event === 'receivedByWallet'),
            map(() => getRequest()),
            tap((request) => {
              if (request.items.discriminator === 'transaction')
                requestItemClient.patch(id, { showCancel: false })
            }),
          ),
        )
        firstValueFrom(
          cancelRequestSubject.pipe(
            filter((requestItemId) => requestItemId === id),
            switchMap(() =>
              requestItemClient.cancel(id).andThen(() => cancelRequest()),
            ),
          ),
        )
      },
    } satisfies Parameters<WalletRequestSdk['request']>[1]
  }

  let challengeGeneratorFn: () => Promise<string> = () => Promise.resolve('')

  let connectResponseCallback:
    | ((result: AwaitedWalletDataRequestResult) => any)
    | undefined

  let dataRequestControl: (
    walletData: WalletData,
  ) => ResultAsync<any, { error: string; message: string }>

  const isChallengeNeeded = (dataRequestState: DataRequestState) =>
    dataRequestState.accounts?.withProof || dataRequestState.persona?.withProof

  const getChallenge = (
    dataRequestState: DataRequestState,
  ): ResultAsync<string | undefined, SdkError> => {
    if (!isChallengeNeeded(dataRequestState)) return okAsync(undefined)

    return ResultAsync.fromPromise(challengeGeneratorFn(), () =>
      SdkError('ChallengeGeneratorError', '', 'failed to generate challenge'),
    )
  }

  const provideConnectResponseCallback = (
    fn: (result: AwaitedWalletDataRequestResult) => any,
  ) => {
    connectResponseCallback = (result) => fn(result)
  }

  const provideDataRequestControl = (
    fn: (walletData: WalletData) => Promise<any>,
  ) => {
    dataRequestControl = (walletData: WalletData) =>
      ResultAsync.fromPromise(fn(walletData), () => ({
        error: 'LoginRejectedByDapp',
        message: 'Login rejected by dApp',
      }))
  }

  const sendOneTimeRequest = (...items: DataRequestBuilderItem[]) =>
    sendRequest({
      dataRequestState: dataRequestStateClient.toDataRequestState(...items),
      isConnect: false,
      oneTime: true,
    })

  const resolveWalletResponse = (
    walletInteraction: WalletInteraction,
    walletInteractionResponse: WalletInteractionResponse,
  ) => {
    if (
      walletInteractionResponse.discriminator === 'success' &&
      walletInteractionResponse.items.discriminator === 'authorizedRequest'
    ) {
      return ResultAsync.combine([
        transformWalletResponseToRdtWalletData(walletInteractionResponse.items),
        stateClient.store.getState(),
      ]).andThen(([walletData, state]) => {
        return stateClient.store
          .setState({
            loggedInTimestamp: Date.now().toString(),
            walletData,
            sharedData: transformWalletRequestToSharedData(
              walletInteraction,
              state!.sharedData,
            ),
          })
          .andThen(() =>
            requestItemClient.updateStatus({
              id: walletInteractionResponse.interactionId,
              status: 'success',
            }),
          )
      })
    }

    return okAsync(undefined)
  }

  const sendDataRequest = (walletInteraction: WalletInteraction) => {
    return walletRequestSdk
      .request(
        walletInteraction,
        cancelRequestControl(walletInteraction.interactionId),
      )
      .map((response: WalletInteractionResponse) => {
        logger?.debug({ method: 'sendDataRequest.successResponse', response })

        return response
      })
      .mapErr((error) => {
        logger?.debug({ method: 'sendDataRequest.errorResponse', error })

        requestItemClient.updateStatus({
          id: walletInteraction.interactionId,
          status: 'fail',
          error: error.error,
        })

        return error
      })
  }

  const sendRequest = ({
    isConnect,
    oneTime,
    dataRequestState,
  }: {
    dataRequestState: DataRequestState
    isConnect: boolean
    oneTime: boolean
  }): WalletDataRequestResult => {
    return ResultAsync.combine([
      getChallenge(dataRequestState),
      stateClient.getState().mapErr(() => SdkError('FailedToReadRdtState', '')),
    ]).andThen(([challenge, state]) =>
      toWalletRequest({
        dataRequestState,
        isConnect,
        oneTime,
        challenge,
        walletData: state.walletData,
      })
        .mapErr(() => SdkError('FailedToTransformWalletRequest', ''))
        .asyncAndThen((walletDataRequest) => {
          const walletInteraction: WalletInteraction =
            walletRequestSdk.createWalletInteraction(walletDataRequest)

          if (
            canDataRequestBeResolvedByRdtState(walletDataRequest, state) &&
            useCache
          )
            return okAsync(state.walletData)

          const isLoginRequest =
            !state.walletData.persona &&
            walletDataRequest.discriminator === 'authorizedRequest'

          return requestItemClient
            .add({
              type: isLoginRequest ? 'loginRequest' : 'dataRequest',
              walletInteraction,
              isOneTimeRequest: oneTime,
            })
            .mapErr(({ message }) =>
              SdkError(
                'FailedToCreateRequestItem',
                walletInteraction.interactionId,
                message,
              ),
            )
            .andThen(() =>
              sendDataRequest(walletInteraction)
                .andThen((walletInteractionResponse) => {
                  if (
                    walletInteractionResponse.discriminator === 'success' &&
                    walletInteractionResponse.items.discriminator !==
                      'transaction'
                  )
                    return ok(walletInteractionResponse.items)

                  return err(
                    SdkError(
                      'WalletResponseFailure',
                      walletInteractionResponse.interactionId,
                      'expected data response',
                    ),
                  )
                })
                .andThen(transformWalletResponseToRdtWalletData)
                .andThen((transformedWalletResponse) => {
                  if (dataRequestControl)
                    return dataRequestControl(transformedWalletResponse)
                      .andThen(() =>
                        requestItemClient
                          .updateStatus({
                            id: walletInteraction.interactionId,
                            status: 'success',
                          })
                          .mapErr((error) =>
                            SdkError(
                              error.reason,
                              walletInteraction.interactionId,
                            ),
                          )
                          .map(() => transformedWalletResponse),
                      )
                      .mapErr((error) => {
                        requestItemClient.updateStatus({
                          id: walletInteraction.interactionId,
                          status: 'fail',
                          error: error.error,
                        })
                        return SdkError(
                          error.error,
                          walletInteraction.interactionId,
                        )
                      })

                  return requestItemClient
                    .updateStatus({
                      id: walletInteraction.interactionId,
                      status: 'success',
                    })
                    .map(() => transformedWalletResponse)
                    .mapErr((error) =>
                      SdkError(error.reason, walletInteraction.interactionId),
                    )
                })
                .map((transformedWalletResponse) => {
                  interactionStatusChangeSubject.next('success')

                  if (!oneTime)
                    stateClient.setState({
                      loggedInTimestamp: Date.now().toString(),
                      walletData: transformedWalletResponse,
                      sharedData: transformWalletRequestToSharedData(
                        walletInteraction,
                        state.sharedData,
                      ),
                    })

                  return transformedWalletResponse
                })
                .mapErr((err) => {
                  interactionStatusChangeSubject.next('fail')
                  return err
                }),
            )
        }),
    )
  }

  const setRequestDataState = (...items: DataRequestBuilderItem[]) => {
    dataRequestStateClient.setState(...items)
    return {
      sendRequest: () =>
        sendRequest({
          dataRequestState: dataRequestStateClient.getState(),
          isConnect: false,
          oneTime: false,
        }),
    }
  }

  const updateSharedData = () =>
    stateClient.store
      .getState()
      .mapErr((err) => {
        logger?.error(err)
        return {
          error: 'FailedToReadRdtState',
          message: 'failed to read rdt state',
          jsError: err,
        }
      })
      .andThen((state) =>
        sendRequest({
          dataRequestState: transformSharedDataToDataRequestState(
            state!.sharedData,
          ),
          isConnect: false,
          oneTime: false,
        }),
      )

  const subscriptions = new Subscription()

  const requestItemStore$ = merge(requestItemClient.store.storage$, of(null))

  const requestItems$ = requestItemStore$.pipe(
    switchMap(() => requestItemClient.store.getItemList()),
    map((result) => {
      if (result.isOk()) return result.value
    }),
    filter((items): items is RequestItem[] => !!items),
  )

  subscriptions.add(
    requestItems$
      .pipe(
        mergeMap((items) => {
          const unresolvedItems = items
            .filter((item) => item.status === 'pending' && item.walletResponse)
            .map((item) =>
              resolveWalletResponse(
                item.walletInteraction,
                item.walletResponse,
              ),
            )

          return ResultAsync.combineWithAllErrors(unresolvedItems)
        }),
      )
      .subscribe(),
  )

  const sendTransaction = (
    value: SendTransactionInput,
  ): ResultAsync<
    {
      transactionIntentHash: string
      status: TransactionStatus
    },
    SdkError
  > => {
    const walletInteraction = walletRequestSdk.createWalletInteraction({
      discriminator: 'transaction',
      send: {
        blobs: value.blobs,
        transactionManifest: value.transactionManifest,
        message: value.message,
        version: value.version ?? 1,
      },
    })

    requestItemClient.add({
      type: 'sendTransaction',
      walletInteraction,
      isOneTimeRequest: false,
    })

    return walletRequestSdk
      .sendTransaction(
        walletInteraction,
        cancelRequestControl(walletInteraction.interactionId),
      )
      .mapErr((response): SdkError => {
        requestItemClient.updateStatus({
          id: walletInteraction.interactionId,
          status: 'fail',
          error: response.error,
        })
        logger?.debug({ method: 'sendTransaction.errorResponse', response })
        return response
      })
      .andThen(
        (response): Result<{ transactionIntentHash: string }, SdkError> => {
          logger?.debug({ method: 'sendTransaction.successResponse', response })
          if (
            response.discriminator === 'success' &&
            response.items.discriminator === 'transaction'
          )
            return ok(response.items.send)

          if (response.discriminator === 'failure')
            return err(
              SdkError(
                response.error,
                response.interactionId,
                response.message,
              ),
            )

          return err(SdkError('WalletResponseFailure', response.interactionId))
        },
      )
      .andThen(({ transactionIntentHash }) => {
        if (value.onTransactionId) value.onTransactionId(transactionIntentHash)
        return gatewayClient
          .pollTransactionStatus(transactionIntentHash)
          .map((transactionStatusResponse) => ({
            transactionIntentHash,
            status: transactionStatusResponse.status,
          }))
      })
      .andThen((response) => {
        const failedTransactionStatus: TransactionStatus[] = [
          TransactionStatus.Rejected,
          TransactionStatus.CommittedFailure,
        ]

        const isFailedTransaction = failedTransactionStatus.includes(
          response.status,
        )

        logger?.debug({
          method: 'sendTransaction.pollTransactionStatus.completed',
          response,
        })

        const status = isFailedTransaction ? 'fail' : 'success'

        return requestItemClient
          .updateStatus({
            id: walletInteraction.interactionId,
            status,
            transactionIntentHash: response.transactionIntentHash,
          })
          .mapErr(() =>
            SdkError(
              'FailedToUpdateRequestItem',
              walletInteraction.interactionId,
            ),
          )
          .andThen(() => {
            interactionStatusChangeSubject.next(status)
            return isFailedTransaction
              ? err(
                  SdkError(
                    'TransactionNotSuccessful',
                    walletInteraction.interactionId,
                  ),
                )
              : ok(response)
          })
      })
  }

  const getTransport = () =>
    transports.find((transport) => transport.isSupported())

  const getPendingRequests = () =>
    requestItemClient.store
      .getItemList()
      .map((items) => items.filter((item) => item.status === 'pending'))

  const cancelRequest = (id: string) => {
    cancelRequestSubject.next(id)
    requestItemClient.cancel(id)
    interactionStatusChangeSubject.next('fail')
  }

  const provideChallengeGenerator = (fn: () => Promise<string>) => {
    challengeGeneratorFn = fn
  }

  const disconnect = () => {
    requestItemClient.store.getItemList().map((items) => {
      items.forEach((item) => {
        if (item.showCancel) cancelRequestSubject.next(item.interactionId)
      })
    })

    stateClient.reset()
    requestItemClient.store.clear()
  }

  const destroy = () => {
    stateClient.destroy()
    requestItemClient.destroy()
    input.providers.transports?.forEach((transport) => transport.destroy())

    subscriptions.unsubscribe()
  }

  return {
    sendRequest: (input: { isConnect: boolean; oneTime: boolean }) => {
      const result = sendRequest({
        isConnect: input.isConnect,
        oneTime: input.oneTime,
        dataRequestState: dataRequestStateClient.getState(),
      })

      if (connectResponseCallback)
        result
          .map((result) => {
            connectResponseCallback!(ok(result))
          })
          .mapErr((error) => {
            connectResponseCallback!(err(error))
          })

      return result
    },
    sendTransaction,
    cancelRequest,
    requestItemClient,
    provideChallengeGenerator,
    provideDataRequestControl,
    provideConnectResponseCallback,
    sendOneTimeRequest,
    setRequestDataState,
    getPendingRequests,
    getTransport,
    updateSharedData,
    interactionStatusChange$: interactionStatusChangeSubject.asObservable(),
    requestItems$,
    disconnect,
    destroy,
  }
}
