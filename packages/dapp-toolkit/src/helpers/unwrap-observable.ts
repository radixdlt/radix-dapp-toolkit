import { Result, ResultAsync } from 'neverthrow'
import { firstValueFrom, Observable } from 'rxjs'
import { SdkError } from '../error'

export const unwrapObservable = (
  input: Observable<Result<any, SdkError>>,
): ResultAsync<any, SdkError> =>
  ResultAsync.fromPromise(
    firstValueFrom(input),
    (error) => error as SdkError,
  ).andThen((result) => result)
