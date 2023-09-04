import { Buffer } from 'buffer'
import blake from 'blakejs'
import { bufferToUnit8Array } from './blake2b'

export function hash(input: string): Buffer {
  return Buffer.from(
    blake
      .blake2bHex(bufferToUnit8Array(Buffer.from(input, 'hex')), undefined, 32)
      .toString(),
    'hex'
  )
}
