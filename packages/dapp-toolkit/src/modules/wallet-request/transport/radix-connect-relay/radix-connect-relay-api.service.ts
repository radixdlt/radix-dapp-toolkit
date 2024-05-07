import { Ok, Result, ResultAsync, err, ok } from 'neverthrow'
import { SdkError } from '../../../../error'
import { Logger, fetchWrapper, parseJSON } from '../../../../helpers'
import {
  WalletInteraction,
  WalletInteractionResponse,
} from '../../../../schemas'
import { EncryptionModule, transformBufferToSealbox } from '../../encryption'
import {
  Subject,
  filter,
  first,
  firstValueFrom,
  merge,
  of,
  switchMap,
} from 'rxjs'
import { Buffer } from 'buffer'
import { ActiveSession } from '../../session/session.module'

export type RadixConnectRelayApiService = ReturnType<
  typeof RadixConnectRelayApiService
>
export const RadixConnectRelayApiService = (input: {
  baseUrl: string
  logger?: Logger
  providers: { encryptionModule: EncryptionModule }
}) => {
  const baseUrl = input.baseUrl
  const logger = input.logger?.getSubLogger({ name: 'RadixConnectRelayApi' })
  const encryptionModule = input.providers.encryptionModule

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

  const decryptResponse = (
    secretHex: string,
    value: string,
  ): ResultAsync<WalletInteractionResponse, SdkError> =>
    transformBufferToSealbox(Buffer.from(value, 'hex'))
      .asyncAndThen(({ ciphertextAndAuthTag, iv }) =>
        encryptionModule.decrypt(
          ciphertextAndAuthTag,
          Buffer.from(secretHex, 'hex'),
          iv,
        ),
      )
      .andThen((decrypted) =>
        parseJSON<WalletInteractionResponse>(decrypted.toString('utf-8')),
      )
      .mapErr(() => SdkError('FailedToDecrypt', ''))

  const encryptWalletInteraction = (
    walletInteraction: WalletInteraction,
    secret: Buffer,
  ): ResultAsync<string, SdkError> =>
    encryptionModule
      .encrypt(Buffer.from(JSON.stringify(walletInteraction), 'utf-8'), secret)
      .mapErr(() =>
        SdkError(
          'FailEncryptWalletInteraction',
          walletInteraction.interactionId,
        ),
      )
      .map((sealedBoxProps) => sealedBoxProps.combined.toString('hex'))

  const sendRequest = (
    { sessionId, sharedSecret }: ActiveSession,
    walletInteraction: WalletInteraction,
  ): ResultAsync<void, SdkError> =>
    encryptWalletInteraction(
      walletInteraction,
      Buffer.from(sharedSecret, 'hex'),
    ).andThen((encryptedWalletInteraction) =>
      callApi({
        method: 'sendRequest',
        sessionId,
        data: encryptedWalletInteraction,
      }).map(() => undefined),
    )

  const getResponses = (session: ActiveSession) =>
    callApi<string[]>({
      method: 'getResponses',
      sessionId: session.sessionId,
    }).andThen((value) =>
      ResultAsync.combine(
        value.data.map((encryptedWalletInteraction) =>
          decryptResponse(session.sharedSecret, encryptedWalletInteraction),
        ),
      ),
    )

  const sendHandshakeRequest = (
    sessionId: string,
    publicKeyHex: string,
  ): ResultAsync<void, SdkError> =>
    callApi({
      method: 'sendHandshakeRequest',
      sessionId,
      data: publicKeyHex,
    }).map(() => undefined)

  const getHandshakeResponse = (
    sessionId: string,
  ): ResultAsync<string, SdkError> => {
    const getPublicKeyFromData = (data: {
      publicKey: string
    }): Result<string, { reason: string }> => {
      const publicKeyRaw = data?.publicKey

      if (!publicKeyRaw) err({ reason: 'NotFound' })

      const publicKey = Buffer.from(publicKeyRaw, 'hex').toString('utf-8')

      return parseJSON(publicKey)
        .mapErr(() => ({ reason: 'FailedToParsePublicKey' }))
        .andThen((parsed): Result<string, { reason: string }> => {
          logger?.debug({ parsed })
          return parsed?.publicKey
            ? ok(parsed.publicKey)
            : err({ reason: 'NotFound' })
        })
    }

    const sendApiRequest = () =>
      callApi<{ publicKey: string }>({
        method: 'getHandshakeResponse',
        sessionId,
      }).andThen(({ data }) => getPublicKeyFromData(data))

    return ResultAsync.fromPromise(
      firstValueFrom(
        of(null).pipe(
          switchMap(() => {
            const trigger = new Subject<number>()
            return merge(trigger, of(0)).pipe(
              switchMap((retry) =>
                sendApiRequest().mapErr((err) => {
                  trigger.next(retry + 1)
                  return err
                }),
              ),
              filter((result): result is Ok<string, never> => {
                return result.isOk()
              }),
              first(),
            )
          }),
        ),
      ),
      () => {
        return SdkError('FailedToGetHandshakeResponseToRadixConnectRelay', '')
      },
    ).andThen((result) => result)
  }

  return {
    sendRequest,
    getResponses,
    sendHandshakeRequest,
    getHandshakeResponse,
  }
}
