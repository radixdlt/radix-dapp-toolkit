import { WalletRequestSdk } from './wallet-request-sdk'
import {
  Subject,
  Subscription,
  filter,
  firstValueFrom,
  map,
  switchMap,
  tap,
} from 'rxjs'
import { validateRolaChallenge, type Logger } from '../../helpers'
import { TransactionStatus } from '../gateway'
import { ResultAsync, err, ok, okAsync } from 'neverthrow'
import type { MessageLifeCycleEvent, WalletInteraction } from '../../schemas'
import { SdkError } from '../../error'
import {
  DataRequestBuilderItem,
  DataRequestState,
  DataRequestStateModule,
  canDataRequestBeResolvedByRdtState,
  toWalletRequest,
  transformSharedDataToDataRequestState,
} from './data-request'
import { StorageModule } from '../storage'
import type { StateModule, WalletData } from '../state'
import {
  AwaitedWalletDataRequestResult,
  SendPreAuthorizationRequestInput,
  SendTransactionInput,
  TransportProvider,
  WalletDataRequestResult,
} from '../../_types'
import { ConnectorExtensionModule, RadixConnectRelayModule } from './transport'
import { GatewayModule } from '../gateway'
import { RequestItemModule } from './request-items'
import { RequestResolverModule } from './request-resolver/request-resolver.module'
import {
  dataResponseResolver,
  failedResponseResolver,
  sendTransactionResponseResolver,
} from './request-resolver'
import { RequestItemTypes } from 'radix-connect-common'

export type WalletRequestModule = ReturnType<typeof WalletRequestModule>
export const WalletRequestModule = (input: {
  logger?: Logger
  origin?: string
  networkId: number
  useCache: boolean
  requestInterceptor?: (input: WalletInteraction) => Promise<WalletInteraction>
  dAppDefinitionAddress: string
  providers: {
    stateModule: StateModule
    storageModule: StorageModule
    gatewayModule: GatewayModule
    transports?: TransportProvider[]
    dataRequestStateModule?: DataRequestStateModule
    requestItemModule?: RequestItemModule
    walletRequestSdk?: WalletRequestSdk
    requestResolverModule?: RequestResolverModule
  }
}) => {
  const logger = input.logger?.getSubLogger({ name: 'WalletRequestModule' })
  const useCache = input.useCache
  const networkId = input.networkId
  const cancelRequestSubject = new Subject<string>()
  const ignoreTransactionSubject = new Subject<string>()
  const interactionStatusChangeSubject = new Subject<
    'fail' | 'success' | 'pending'
  >()
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

  const updateConnectButtonStatus = (
    status: 'success' | 'fail' | 'pending',
  ) => {
    interactionStatusChangeSubject.next(status)
  }

  const requestResolverModule =
    input.providers.requestResolverModule ??
    RequestResolverModule({
      logger,
      providers: {
        storageModule,
        requestItemModule,
        stateModule,
        resolvers: [
          sendTransactionResponseResolver({
            gatewayModule,
            requestItemModule,
            updateConnectButtonStatus,
          }),
          failedResponseResolver({
            requestItemModule,
            updateConnectButtonStatus,
          }),
          dataResponseResolver({
            requestItemModule,
            getDataRequestController: () => dataRequestControl,
            stateModule,
            updateConnectButtonStatus,
          }),
        ],
        updateConnectButtonStatus: (status) => {
          interactionStatusChangeSubject.next(status)
        },
        gatewayModule,
      },
    })

  const transports: TransportProvider[] = input.providers.transports ?? [
    ConnectorExtensionModule({
      logger,
      providers: { storageModule, requestResolverModule },
    }),
    RadixConnectRelayModule({
      logger,
      walletUrl: 'radixWallet://connect',
      baseUrl: 'https://radix-connect-relay.radixdlt.com',
      dAppDefinitionAddress: input.dAppDefinitionAddress,
      providers: {
        requestItemModule,
        storageModule,
        requestResolverModule,
      },
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
    } satisfies Parameters<WalletRequestSdk['sendInteraction']>[1]
  }

  let challengeGeneratorFn: () => Promise<string> = () => Promise.resolve('')

  let connectResponseCallback:
    | ((result: AwaitedWalletDataRequestResult) => any)
    | undefined

  let dataRequestControl: (
    walletData: WalletData,
  ) => ResultAsync<any, { error: string; message: string }>

  const isChallengeNeeded = (dataRequestState: DataRequestState) =>
    dataRequestState.accounts?.withProof ||
    dataRequestState.persona?.withProof ||
    dataRequestState.proofOfOwnership

  const getChallenge = (
    dataRequestState: DataRequestState,
  ): ResultAsync<string | undefined, SdkError> => {
    if (!isChallengeNeeded(dataRequestState)) return okAsync(undefined)

    return ResultAsync.fromPromise(challengeGeneratorFn(), () =>
      SdkError('ChallengeGeneratorError', '', 'failed to generate challenge'),
    ).andThen((challenge) =>
      validateRolaChallenge(challenge)
        ? ok(challenge)
        : err(SdkError('ChallengeValidationError', '', 'challenge is invalid')),
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

  const sendRequestAndAwaitResponse = (
    walletInteraction: WalletInteraction,
  ) => {
    updateConnectButtonStatus('pending')
    return ResultAsync.combine([
      walletRequestSdk.sendInteraction(
        walletInteraction,
        cancelRequestControl(walletInteraction.interactionId),
      ),
      requestResolverModule.waitForWalletResponse(
        walletInteraction.interactionId,
      ),
    ]).map(([_, response]) => response)
  }

  const sendOneTimeRequest = (...items: DataRequestBuilderItem[]) =>
    sendRequest({
      dataRequestState: dataRequestStateModule.toDataRequestState(...items),
      isConnect: false,
      oneTime: true,
    })

  const sendDataRequest = (walletInteraction: WalletInteraction) =>
    sendRequestAndAwaitResponse(walletInteraction)
      .andThen((response) => {
        logger?.debug({ method: 'sendDataRequest.successResponse', response })
        return ok(response.walletData! as WalletData)
      })
      .mapErr((error) => {
        logger?.debug({ method: 'sendDataRequest.errorResponse', error })
        return error
      })

  const getRdtState = () =>
    stateModule.getState().mapErr(() => SdkError('FailedToReadRdtState', ''))

  const addNewRequest = (
    type: RequestItemTypes,
    walletInteraction: WalletInteraction,
    isOneTimeRequest: boolean,
  ) =>
    requestItemModule
      .add({
        type,
        walletInteraction,
        isOneTimeRequest,
      })
      .mapErr(({ message }) =>
        SdkError(
          'FailedToCreateRequestItem',
          walletInteraction.interactionId,
          message,
        ),
      )

  const sendPreAuthorizationRequest = (
    value: SendPreAuthorizationRequestInput,
  ): ResultAsync<
    {
      signedPartialTransaction: string
    },
    SdkError
  > => {
    const walletInteraction = walletRequestSdk.createWalletInteraction({
      discriminator: 'preAuthorizationRequest',
      request: value.toRequestItem(),
    })

    return addNewRequest('preAuthorizationRequest', walletInteraction, false)
      .andThen(() => sendRequestAndAwaitResponse(walletInteraction))
      .map((requestItem) => ({
        signedPartialTransaction:
          requestItem.walletResponse.response.signedPartialTransaction,
      }))
  }

  const sendRequest = ({
    isConnect,
    oneTime,
    dataRequestState,
  }: {
    dataRequestState: DataRequestState
    isConnect: boolean
    oneTime: boolean
  }): WalletDataRequestResult =>
    ResultAsync.combine([
      getChallenge(dataRequestState),
      getRdtState(),
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

          const isProofOfOwnershipRequest =
            walletDataRequest.discriminator === 'authorizedRequest' &&
            !!walletDataRequest.proofOfOwnership

          const requestType = isLoginRequest
            ? 'loginRequest'
            : isProofOfOwnershipRequest
              ? 'proofRequest'
              : 'dataRequest'

          return addNewRequest(requestType, walletInteraction, oneTime).andThen(
            () => sendDataRequest(walletInteraction),
          )
        }),
    )

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

  const updateSharedAccounts = () =>
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

  const sendTransaction = (
    value: SendTransactionInput,
  ): ResultAsync<
    {
      transactionIntentHash: string
      status: TransactionStatus
    },
    SdkError
  > => {
    const createTransactionRequest = () => {
      const walletInteraction = walletRequestSdk.createWalletInteraction({
        discriminator: 'transaction',
        send: {
          blobs: value.blobs,
          transactionManifest: value.transactionManifest,
          message: value.message,
          version: value.version ?? 1,
        },
      })

      return requestItemModule
        .add({
          type: 'sendTransaction',
          walletInteraction,
          isOneTimeRequest: false,
        })
        .mapErr(() =>
          SdkError('FailedToAddRequestItem', walletInteraction.interactionId),
        )
        .map(() => walletInteraction)
    }

    return createTransactionRequest()
      .andThen((walletInteraction) =>
        sendRequestAndAwaitResponse(walletInteraction),
      )
      .andThen(({ status, transactionIntentHash, metadata, interactionId }) => {
        const output = {
          transactionIntentHash: transactionIntentHash!,
          status: metadata!.transactionStatus as TransactionStatus,
        }

        if (value.onTransactionId)
          value.onTransactionId(output.transactionIntentHash)

        return status === 'success'
          ? ok(output)
          : err(SdkError(output.status, interactionId))
      })
  }

  const getTransport = (): TransportProvider | undefined =>
    transports.find((transport) => transport.isSupported())

  const getPendingRequests = () => requestItemModule.getPending()

  const cancelRequest = (id: string) => {
    cancelRequestSubject.next(id)
    requestItemModule.cancel(id)
    interactionStatusChangeSubject.next('fail')
    updateConnectButtonStatus('fail')
  }

  const ignoreTransaction = (id: string) => {
    ignoreTransactionSubject.next(id)
    requestItemModule.updateStatus({
      id,
      status: 'ignored',
    })
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
    requestResolverModule.destroy()
    input.providers.transports?.forEach((transport) => transport.destroy())

    subscriptions.unsubscribe()
  }

  return {
    sendRequest: (input: { isConnect: boolean; oneTime: boolean }) =>
      sendRequest({
        isConnect: input.isConnect,
        oneTime: input.oneTime,
        dataRequestState: dataRequestStateModule.getState(),
      })
        .andThen((response) => {
          if (connectResponseCallback) connectResponseCallback!(ok(response))
          return ok(response)
        })
        .orElse((error) => {
          if (connectResponseCallback) connectResponseCallback!(err(error))
          return err(error)
        }),
    sendTransaction,
    sendPreAuthorizationRequest,
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
    updateSharedAccounts,
    dataRequestStateModule,
    interactionStatusChange$: interactionStatusChangeSubject.asObservable(),
    requestItems$: requestItemModule.requests$,
    disconnect,
    destroy,
  }
}
