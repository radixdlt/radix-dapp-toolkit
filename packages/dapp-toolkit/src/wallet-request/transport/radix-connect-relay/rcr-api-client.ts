import { Ok, Result, ResultAsync, err, ok } from 'neverthrow'
import { SdkError } from '../../../error'
import { Logger, fetchWrapper, parseJSON } from '../../../helpers'
import { WalletInteraction, WalletInteractionResponse } from '../../../schemas'
import { EncryptionClient, transformBufferToSealbox } from '../../encryption'
import { ActiveSession } from '../../../../dist'
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

export type RadixConnectRelayApiClient = ReturnType<
  typeof RadixConnectRelayApiClient
>
export const RadixConnectRelayApiClient = (input: {
  baseUrl: string
  logger?: Logger
  providers: { encryptionClient: EncryptionClient }
}) => {
  const baseUrl = input.baseUrl
  const logger = input.logger?.getSubLogger({ name: 'RadixConnectRelayApi' })
  const encryptionClient = input.providers.encryptionClient

  const decryptResponse = (
    secretHex: string,
    value: string,
  ): ResultAsync<WalletInteractionResponse, SdkError> =>
    transformBufferToSealbox(Buffer.from(value, 'hex'))
      .asyncAndThen(({ ciphertextAndAuthTag, iv }) =>
        encryptionClient.decrypt(
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
    encryptionClient
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
  ): ResultAsync<void, SdkError> => {
    logger?.debug({ method: 'sendRequest', sessionId, walletInteraction })
    return encryptWalletInteraction(
      walletInteraction,
      Buffer.from(sharedSecret, 'hex'),
    ).andThen((encryptedWalletInteraction) =>
      fetchWrapper(
        fetch(baseUrl, {
          method: 'POST',
          body: JSON.stringify({
            method: 'sendRequest',
            sessionId,
            data: encryptedWalletInteraction,
          }),
        }),
      )
        .map(() => undefined)
        .mapErr(() => SdkError('FailedToSendRequestToRadixConnectRelay', '')),
    )
  }

  const getResponses = (session: ActiveSession) =>
    fetchWrapper<string[]>(
      fetch(baseUrl, {
        method: 'POST',
        body: JSON.stringify({
          method: 'getResponses',
          sessionId: session.sessionId,
        }),
      }),
    )
      .mapErr(() => SdkError('FailedToGetRequestsFromRadixConnectRelay', ''))
      .andThen((value) =>
        ResultAsync.combine(
          value.data.map((encryptedWalletInteraction) =>
            decryptResponse(session.sharedSecret, encryptedWalletInteraction),
          ),
        ),
      )

  const sendHandshakeRequest = (
    sessionId: string,
    publicKeyHex: string,
  ): ResultAsync<void, SdkError> => {
    logger?.debug({ method: 'sendHandshakeRequest', sessionId, publicKeyHex })
    return fetchWrapper(
      fetch(baseUrl, {
        method: 'POST',
        body: JSON.stringify({
          method: 'sendHandshakeRequest',
          sessionId,
          data: publicKeyHex,
        }),
      }),
    )
      .map(() => {
        logger?.debug({
          method: 'sendHandshakeRequestToRadixConnectRelay.success',
        })
      })
      .mapErr(() => {
        logger?.debug({
          method: 'sendHandshakeRequestToRadixConnectRelay.error',
        })
        return SdkError('FailedToSendHandshakeRequestToRadixConnectRelay', '')
      })
  }

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

    const sendApiRequest = (retry: number) => {
      logger?.debug({ method: 'getHandshakeResponse', sessionId, retry })
      return fetchWrapper<{ publicKey: string }>(
        fetch(baseUrl, {
          method: 'POST',
          body: JSON.stringify({
            method: 'getHandshakeResponse',
            sessionId,
          }),
        }),
      ).andThen(({ data }) => getPublicKeyFromData(data))
    }

    return ResultAsync.fromPromise(
      firstValueFrom(
        of(null).pipe(
          switchMap(() => {
            const trigger = new Subject<number>()
            return merge(trigger, of(0)).pipe(
              switchMap((retry) =>
                sendApiRequest(retry).mapErr((err) => {
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
      (error) => {
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
