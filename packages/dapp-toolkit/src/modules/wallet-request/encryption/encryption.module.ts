import { ResultAsync } from 'neverthrow'
import { typedError } from '../../../helpers/typed-error'
import type { SealedBoxProps } from './helpers/sealbox'
import { Buffer } from 'buffer'

export type EncryptionModule = ReturnType<typeof EncryptionModule>
export const EncryptionModule = () => {
  const cryptoDecrypt = (data: Buffer, encryptionKey: CryptoKey, iv: Buffer) =>
    ResultAsync.fromPromise(
      crypto.subtle.decrypt({ name: 'AES-GCM', iv }, encryptionKey, data),
      typedError,
    ).map(Buffer.from)

  const cryptoEncrypt = (data: Buffer, encryptionKey: CryptoKey, iv: Buffer) =>
    ResultAsync.fromPromise(
      crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        encryptionKey,
        data,
      ),
      typedError,
    ).map(Buffer.from)

  const getKey = (encryptionKey: Buffer) =>
    ResultAsync.fromPromise(
      crypto.subtle.importKey(
        'raw',
        encryptionKey,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['encrypt', 'decrypt'],
      ),
      typedError,
    )

  const combineIVandCipherText = (iv: Buffer, ciphertext: Buffer): Buffer =>
    Buffer.concat([iv, ciphertext])

  const decrypt = (
    data: Buffer,
    encryptionKey: Buffer,
    iv: Buffer,
  ): ResultAsync<Buffer, Error> =>
    getKey(encryptionKey).andThen((cryptoKey) =>
      cryptoDecrypt(data, cryptoKey, iv),
    )

  const encrypt = (
    data: Buffer,
    encryptionKey: Buffer,
    iv = createIV(),
  ): ResultAsync<
    Omit<SealedBoxProps, 'ciphertextAndAuthTag' | 'authTag'>,
    Error
  > =>
    getKey(encryptionKey)
      .andThen((cryptoKey) => cryptoEncrypt(data, cryptoKey, iv))
      .map((ciphertext) => ({
        combined: combineIVandCipherText(iv, ciphertext),
        iv,
        ciphertext,
      }))

  const createIV = () => Buffer.from(crypto.getRandomValues(new Uint8Array(12)))

  return { encrypt, decrypt, createIV }
}
