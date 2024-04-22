import { ResultAsync, errAsync, okAsync } from 'neverthrow'
import { TransportProvider } from '../_types'
import { Logger, validateWalletResponse } from '../helpers'
import {
  Metadata,
  CallbackFns,
  WalletInteractionItems,
  WalletInteraction,
  WalletInteractionResponse,
} from '../schemas'
import { parse } from 'valibot'
import { SdkError } from '../error'

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
    interactionId = crypto.randomUUID(),
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

  const getTransportClient = (
    interactionId: string,
  ): ResultAsync<TransportProvider, SdkError> => {
    const transportClient = availableTransports.find((transportClient) =>
      transportClient.isSupported(),
    )

    return transportClient
      ? okAsync(transportClient)
      : errAsync({
          error: 'SupportedTransportNotFound',
          interactionId,
          message: 'No supported transport found',
        })
  }

  const request = (
    {
      interactionId = crypto.randomUUID(),
      items,
    }: Pick<WalletInteraction, 'items'> & { interactionId?: string },
    callbackFns: Partial<CallbackFns> = {},
  ): ResultAsync<WalletInteractionResponse, SdkError> =>
    withInterceptor({
      items,
      interactionId,
      metadata,
    }).andThen((walletInteraction) =>
      getTransportClient(walletInteraction.interactionId).andThen(
        (transportClient) =>
          transportClient
            .send(walletInteraction, callbackFns)
            .andThen(validateWalletResponse),
      ),
    )

  const sendTransaction = (
    {
      interactionId = crypto.randomUUID(),
      items,
    }: { interactionId?: string; items: WalletInteraction['items'] },
    callbackFns: Partial<CallbackFns> = {},
  ): ResultAsync<WalletInteractionResponse, SdkError> =>
    withInterceptor({
      interactionId,
      items,
      metadata,
    }).andThen((walletInteraction) =>
      getTransportClient(interactionId).andThen((transportClient) =>
        transportClient
          .send(walletInteraction, callbackFns)
          .andThen(validateWalletResponse),
      ),
    )

  return {
    request,
    sendTransaction,
    createWalletInteraction,
  }
}
