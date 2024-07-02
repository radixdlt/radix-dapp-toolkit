import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { typedError } from './typed-error'

export const parseJSON = <T = Record<string, any>>(
  text: string,
): Result<T, Error> => {
  try {
    return ok(JSON.parse(text))
  } catch (error) {
    return err(typedError(error))
  }
}
