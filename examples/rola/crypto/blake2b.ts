import { Result, err, ok } from 'neverthrow'
import blake from 'blakejs'
import { Buffer } from 'buffer'

export const blake2b = (input: Buffer): Result<Buffer, Error> => {
  try {
    return ok(blake.blake2bHex(input, undefined, 32)).map((hex) =>
      Buffer.from(hex, 'hex')
    )
  } catch (error) {
    return err(error as Error)
  }
}
