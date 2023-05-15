import { Result, err, ok } from 'neverthrow'
import { blake2bHex } from 'blakejs'
import { Buffer } from 'buffer'

export const blake2b = (input: Buffer): Result<Buffer, Error> => {
  try {
    return ok(blake2bHex(input, undefined, 32)).map((hex) =>
      Buffer.from(hex, 'hex')
    )
  } catch (error) {
    return err(error as Error)
  }
}
