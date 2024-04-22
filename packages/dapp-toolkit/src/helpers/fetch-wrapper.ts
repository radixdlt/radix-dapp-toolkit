import { ResultAsync, errAsync, okAsync } from 'neverthrow'
import { parseJSON } from './parse-json'

const typedError = <E = Error>(error: unknown) => error as E

const resolveFetch = (fetchable: ReturnType<typeof fetch>) =>
  ResultAsync.fromPromise(fetchable, typedError).mapErr((error) => ({
    reason: 'FailedToFetch',
    error,
    status: 0,
  }))

export const fetchWrapper = <R = unknown, ER = unknown>(
  fetchable: ReturnType<typeof fetch>,
): ResultAsync<
  { status: number; data: R },
  { status: number; error?: Error; reason: string; data?: ER }
> =>
  resolveFetch(fetchable).andThen((response) =>
    ResultAsync.fromPromise<unknown, Error>(response.text(), typedError)
      .andThen((text) => (text ? parseJSON(text as string) : okAsync(text)))
      .mapErr((error) => ({
        status: response.status,
        reason: 'FailedToParseResponseToJson',
        error,
      }))
      .andThen((data) =>
        response.ok
          ? okAsync({
              status: response.status,
              data: data as R,
            })
          : errAsync({
              status: response.status,
              reason: 'RequestStatusNotOk',
              data: data as ER,
            }),
      ),
  )
