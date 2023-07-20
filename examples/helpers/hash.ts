import { Buffer } from 'buffer'
import blake from 'blakejs'

export function hash(input: string): Buffer {
  return Buffer.from(
    blake
      .blake2bHex(Buffer.from(input, 'hex').toString('hex'), undefined, 32)
      .toString(),
    'hex'
  )
}
