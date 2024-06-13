import { SdkError } from '../../../../error'
import { Logger, fetchWrapper, parseJSON } from '../../../../helpers'

export type RadixConnectRelayApiService = ReturnType<
  typeof RadixConnectRelayApiService
>

export type WalletSuccessResponse = {
  sessionId: string
  publicKey: string
  data: string
}

export type WalletErrorResponse = {
  sessionId: string
  error: string
}

export type WalletResponse = WalletSuccessResponse | WalletErrorResponse

export const RadixConnectRelayApiService = (input: {
  baseUrl: string
  logger?: Logger
}) => {
  const baseUrl = input.baseUrl
  const logger = input.logger?.getSubLogger({ name: 'RadixConnectRelayApi' })

  const callApi = <T = any>(
    body: Record<string, string> & { method: string },
  ) => {
    logger?.debug({ method: `callApi.${body.method}`, body })
    return fetchWrapper<T>(
      fetch(baseUrl, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
      .map((response) => {
        logger?.debug({
          method: `callApi.${body.method}.success`,
          response,
        })
        return response
      })
      .mapErr((error) => {
        logger?.debug({
          method: `callApi.${body.method}.error`,
          error,
        })
        return SdkError(
          'RadixConnectRelayRequestFailed',
          body.interactionId ?? '',
        )
      })
  }

  const getResponses = (sessionId: string) =>
    callApi<WalletResponse[]>({
      method: 'getResponses',
      sessionId,
    }).map((value) => value.data)

  return {
    getResponses,
  }
}
