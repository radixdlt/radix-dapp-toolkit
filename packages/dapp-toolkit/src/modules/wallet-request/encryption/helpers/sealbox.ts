import { Buffer } from 'buffer'
import { Result } from 'neverthrow'
import { readBuffer } from './buffer-reader'

export type SealedBoxProps = {
  iv: Buffer
  authTag: Buffer
  combined: Buffer
  ciphertext: Buffer
  ciphertextAndAuthTag: Buffer
}

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
    combined: Buffer.concat([iv, ciphertext, authTag]),
    ciphertextAndAuthTag: Buffer.concat([ciphertext, authTag]),
  }))
}
