import { err, ok, Result } from 'neverthrow'
import crypto from 'node:crypto'

export const secureRandom = (byteCount: number): Result<Buffer, Error> => {
  if (byteCount <= 0) {
    return err(new Error(`byteCount out of boundaries`))
  }
  return ok(crypto.randomBytes(byteCount))
}
