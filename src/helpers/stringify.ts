import { err, ok, Result } from 'neverthrow'

export const stringify = (input: any): Result<string, Error> => {
  try {
    return ok(JSON.stringify(input))
  } catch (error) {
    return err(error as Error)
  }
}
