import { WalletRequestSdk } from './wallet-request-sdk'
import {
  Subject,
  Subscription,
  filter,
  firstValueFrom,
  map,
  mergeMap,
  switchMap,
  tap,
} from 'rxjs'
import type { Logger } from '../../helpers'
import { TransactionStatus } from '../gateway'
import { Result, ResultAsync, err, ok, okAsync } from 'neverthrow'
import type {
  MessageLifeCycleEvent,
  WalletInteraction,
  WalletInteractionResponse,
} from '../../schemas'
import { SdkError } from '../../error'
import {
  DataRequestBuilderItem,
  DataRequestState,
  DataRequestStateModule,
  canDataRequestBeResolvedByRdtState,
  toWalletRequest,
  transformSharedDataToDataRequestState,
  transformWalletRequestToSharedData,
  transformWalletResponseToRdtWalletData,
} from './data-request'
import { StorageModule } from '../storage'
import { StateModule, WalletData } from '../state'
import {
  AwaitedWalletDataRequestResult,
  TransportProvider,
  WalletDataRequestResult,
} from '../../_types'
import { ConnectorExtensionModule, RadixConnectRelayModule } from './transport'
import { GatewayModule } from '../gateway'
import { RequestItemModule } from './request-items'

type SendTransactionInput = {
  transactionManifest: string
  version?: number
  blobs?: string[]
  message?: string
  onTransactionId?: (transactionId: string) => void
}

export type WalletRequestModule = ReturnType<typeof WalletRequestModule>
export const WalletRequestModule = (input: {
  logger?: Logger
  origin?: string
  networkId: number
  useCache: boolean
  requestInterceptor?: (input: WalletInteraction) => Promise<WalletInteraction>
  dAppDefinitionAddress: string
  enableMobile?: boolean
  providers: {
    stateModule: StateModule
    storageModule: StorageModule
    gatewayModule: GatewayModule
    transports?: TransportProvider[]
    dataRequestStateModule?: DataRequestStateModule
    requestItemModule?: RequestItemModule
    walletRequestSdk?: WalletRequestSdk
  }
}) => {
  const logger = input.logger?.getSubLogger({ name: 'WalletRequestModule' })
  const useCache = input.useCache
  const networkId = input.networkId
  const cancelRequestSubject = new Subject<string>()
  const ignoreTransactionSubject = new Subject<string>()
  const interactionStatusChangeSubject = new Subject<'fail' | 'success'>()
  const gatewayModule = input.providers.gatewayModule
  const dAppDefinitionAddress = input.dAppDefinitionAddress

  const stateModule = input.providers.stateModule
  const storageModule = input.providers.storageModule

  const dataRequestStateModule =
    input.providers.dataRequestStateModule ?? DataRequestStateModule({})

  const requestItemModule =
    input.providers.requestItemModule ??
    RequestItemModule({
      logger,
      providers: {
        storageModule: storageModule.getPartition('requests'),
      },
    })

  const transports: TransportProvider[] = input.providers.transports ?? [
    ConnectorExtensionModule({
      logger,
      providers: { requestItemModule, storageModule },
    }),
  ]

  if (input.enableMobile)
    transports.push(
      RadixConnectRelayModule({
        logger,
        walletUrl: 'radixWallet://',
        // baseUrl: 'https://radix-connect-relay.radixdlt.com',
        baseUrl:
          'https://radix-connect-relay-dev.rdx-works-main.extratools.works',
        providers: {
          requestItemModule,
          storageModule,
        },
      }),
    )

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
      eventCallback: (event: any) => {
        messageLifeCycleEvent.next(event)
      },
      requestControl: ({ cancelRequest, getRequest }: any) => {
        firstValueFrom(
          messageLifeCycleEvent.pipe(
            filter((event) => event === 'receivedByWallet'),
            map(() => getRequest()),
            tap((request) => {
              if (request.items.discriminator === 'transaction')
                requestItemModule.patch(id, { showCancel: false })
            }),
          ),
        )
        firstValueFrom(
          cancelRequestSubject.pipe(
            filter((requestItemId) => requestItemId === id),
            switchMap(() =>
              requestItemModule.cancel(id).andThen(() => cancelRequest()),
            ),
          ),
        )
        firstValueFrom(
          ignoreTransactionSubject.pipe(
            filter((requestItemId) => requestItemId === id),
            switchMap(() =>
              requestItemModule
                .updateStatus({
                  id,
                  status: 'ignored',
                })
                .andThen(() => cancelRequest()),
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
      dataRequestState: dataRequestStateModule.toDataRequestState(...items),
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
        stateModule.getState(),
      ]).andThen(([walletData, state]) => {
        return stateModule
          .setState({
            loggedInTimestamp: Date.now().toString(),
            walletData,
            sharedData: transformWalletRequestToSharedData(
              walletInteraction,
              state!.sharedData,
            ),
          })
          .andThen(() =>
            requestItemModule.updateStatus({
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

        requestItemModule.updateStatus({
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
      stateModule.getState().mapErr(() => SdkError('FailedToReadRdtState', '')),
    ])
      .andThen(([challenge, state]) =>
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

            return requestItemModule
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
                          requestItemModule
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
                          requestItemModule.updateStatus({
                            id: walletInteraction.interactionId,
                            status: 'fail',
                            error: error.error,
                          })
                          return SdkError(
                            error.error,
                            walletInteraction.interactionId,
                          )
                        })

                    return requestItemModule
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

                    if (!oneTime) {
                      stateModule
                        .setState({
                          loggedInTimestamp: Date.now().toString(),
                          walletData: transformedWalletResponse,
                          sharedData: transformWalletRequestToSharedData(
                            walletInteraction,
                            state.sharedData,
                          ),
                        })
                        .map(() => {
                          stateModule.emitWalletData()
                        })
                    }

                    return transformedWalletResponse
                  })
                  .mapErr((err) => {
                    interactionStatusChangeSubject.next('fail')
                    return err
                  }),
              )
          }),
      )
      .mapErr((error) => {
        logger?.error(error)
        return error
      })
  }

  const setRequestDataState = (...items: DataRequestBuilderItem[]) => {
    dataRequestStateModule.setState(...items)
    return {
      sendRequest: () =>
        sendRequest({
          dataRequestState: dataRequestStateModule.getState(),
          isConnect: false,
          oneTime: false,
        }),
    }
  }

  const updateSharedData = () =>
    stateModule
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

  subscriptions.add(
    requestItemModule.requests$
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

    requestItemModule.add({
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
        requestItemModule.updateStatus({
          id: walletInteraction.interactionId,
          status: 'fail',
          error: response.error,
        })
        interactionStatusChangeSubject.next('fail')
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
        return gatewayModule
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

        return requestItemModule
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

  const getTransport = (): TransportProvider | undefined =>
    transports.find((transport) => transport.isSupported())

  const getPendingRequests = () => requestItemModule.getPending()

  const cancelRequest = (id: string) => {
    cancelRequestSubject.next(id)
    requestItemModule.cancel(id)
    interactionStatusChangeSubject.next('fail')
  }

  const ignoreTransaction = (id: string) => {
    ignoreTransactionSubject.next(id)
    interactionStatusChangeSubject.next('fail')
  }

  const provideChallengeGenerator = (fn: () => Promise<string>) => {
    challengeGeneratorFn = fn
  }

  const disconnect = () => {
    requestItemModule.getPending().map((items) => {
      items.forEach((item) => {
        if (item.showCancel) cancelRequestSubject.next(item.interactionId)
      })
    })

    stateModule.reset()
    requestItemModule.clear()
    transports.forEach((transport) => transport?.disconnect())
  }

  const destroy = () => {
    stateModule.destroy()
    requestItemModule.destroy()
    input.providers.transports?.forEach((transport) => transport.destroy())

    subscriptions.unsubscribe()
  }

  return {
    sendRequest: (input: { isConnect: boolean; oneTime: boolean }) => {
      const result = sendRequest({
        isConnect: input.isConnect,
        oneTime: input.oneTime,
        dataRequestState: dataRequestStateModule.getState(),
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
    ignoreTransaction,
    requestItemModule,
    provideChallengeGenerator,
    provideDataRequestControl,
    provideConnectResponseCallback,
    sendOneTimeRequest,
    setRequestDataState,
    getPendingRequests,
    getTransport,
    updateSharedData,
    dataRequestStateModule,
    interactionStatusChange$: interactionStatusChangeSubject.asObservable(),
    requestItems$: requestItemModule.requests$,
    disconnect,
    destroy,
  }
}
