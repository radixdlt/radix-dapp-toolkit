import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'

export const stringify = (input: any): Result<string, Error> => {
  try {
    return ok(JSON.stringify(input))
  } catch (error) {
    return err(error as Error)
  }
}
