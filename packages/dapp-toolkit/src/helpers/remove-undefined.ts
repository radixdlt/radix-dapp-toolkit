import { parseJSON } from './parse-json'
import { stringify } from './stringify'

export const removeUndefined = <T>(input: T) =>
  stringify(input).andThen(parseJSON<T>)
