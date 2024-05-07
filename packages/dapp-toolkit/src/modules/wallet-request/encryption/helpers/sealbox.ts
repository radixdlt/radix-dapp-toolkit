import { Buffer } from 'buffer'
import { Result } from 'neverthrow'
import { readBuffer } from './buffer-reader'

export type SealedBoxProps = {
  ciphertext: Buffer
  iv: Buffer
  authTag: Buffer
  combined: Buffer
  ciphertextAndAuthTag: Buffer
}

const combineSealboxToBuffer = ({
  iv,
  ciphertext,
  authTag,
}: Pick<SealedBoxProps, 'iv' | 'ciphertext' | 'authTag'>): Buffer =>
  Buffer.concat([iv, ciphertext, authTag])

const combineCiphertextAndAuthtag = ({
  ciphertext,
  authTag,
}: Pick<SealedBoxProps, 'ciphertext' | 'authTag'>): Buffer =>
  Buffer.concat([ciphertext, authTag])

export const transformBufferToSealbox = (
  buffer: Buffer,
): Result<SealedBoxProps, Error> => {
  const readNextBuffer = readBuffer(buffer)

  const nonceLength = 12
  const authTagLength = 16

  return Result.combine([
    readNextBuffer(nonceLength),
    readNextBuffer(buffer.length - nonceLength - authTagLength),
    readNextBuffer(authTagLength),
  ]).map(([iv, ciphertext, authTag]: Buffer[]) => ({
    iv,
    ciphertext,
    authTag,
    combined: combineSealboxToBuffer({ iv, ciphertext, authTag }),
    ciphertextAndAuthTag: combineCiphertextAndAuthtag({
      ciphertext,
      authTag,
    }),
  }))
}
