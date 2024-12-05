import { Result, ResultAsync, err, errAsync, ok, okAsync } from 'neverthrow'
import { TransportProvider } from '../../_types'
import { Logger } from '../../helpers'
import {
  Metadata,
  CallbackFns,
  WalletInteractionItems,
  WalletInteraction,
  WalletInteractionFailureResponse,
  WalletInteractionResponse,
  WalletInteractionSuccessResponse,
} from '../../schemas'
import { parse } from 'valibot'
import { SdkError } from '../../error'
import { v4 as uuidV4 } from 'uuid'

export type WalletRequestSdkInput = {
  networkId: number
  dAppDefinitionAddress: string
  logger?: Logger
  origin?: string
  requestInterceptor?: (
    walletInteraction: WalletInteraction,
  ) => Promise<WalletInteraction>
  providers: {
    transports: TransportProvider[]
  }
}
export type WalletRequestSdk = ReturnType<typeof WalletRequestSdk>

export const WalletRequestSdk = (input: WalletRequestSdkInput) => {
  const metadata = {
    version: 2,
    dAppDefinitionAddress: input.dAppDefinitionAddress,
    networkId: input.networkId,
    origin: input.origin || window.location.origin,
  } as Metadata

  parse(Metadata, metadata)

  const logger = input?.logger?.getSubLogger({ name: 'WalletSdk' })
  const availableTransports = input.providers.transports

  const requestInterceptorDefault = async (
    walletInteraction: WalletInteraction,
  ) => walletInteraction

  const requestInterceptor =
    input.requestInterceptor ?? requestInterceptorDefault

  logger?.debug({ metadata })

  const createWalletInteraction = (
    items: WalletInteractionItems,
    interactionId = uuidV4(),
  ): WalletInteraction => ({
    items,
    interactionId,
    metadata,
  })

  const withInterceptor = (
    payload: WalletInteraction,
  ): ResultAsync<WalletInteraction, SdkError> =>
    ResultAsync.fromPromise(requestInterceptor(payload), (error: any) =>
      SdkError('requestInterceptorError', payload.interactionId, error.message),
    )

  const getTransport = (
    interactionId: string,
  ): Result<TransportProvider, SdkError> => {
    const transport = availableTransports.find((transport) =>
      transport.isSupported(),
    )

    return transport
      ? ok(transport)
      : err({
          error: 'SupportedTransportNotFound',
          interactionId,
          message: 'No supported transport found',
        })
  }

  const sendInteraction = (
    {
      interactionId = uuidV4(),
      items,
    }: { interactionId?: string; items: WalletInteraction['items'] },
    callbackFns: Partial<CallbackFns> = {},
  ): ResultAsync<
    WalletInteractionSuccessResponse,
    SdkError | WalletInteractionFailureResponse
  > =>
    withInterceptor({
      items,
      interactionId,
      metadata,
    }).andThen((walletInteraction) =>
      getTransport(walletInteraction.interactionId)
        .asyncAndThen((transport) =>
          transport.send(walletInteraction, callbackFns),
        )
        .andThen((response) =>
          response.discriminator === 'failure'
            ? errAsync(response)
            : okAsync(response),
        ),
    )

  return {
    sendInteraction,
    createWalletInteraction,
    getTransport,
  }
}
