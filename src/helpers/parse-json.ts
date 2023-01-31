import { err, ok, Result } from 'neverthrow'
import { errorIdentity } from './error-identity'

export const parseJSON = <T = Record<string, any>>(
  text: string
): Result<T, Error> => {
  try {
    return ok(JSON.parse(text))
  } catch (error) {
    return err(errorIdentity(error))
  }
}
