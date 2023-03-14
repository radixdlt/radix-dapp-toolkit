import { SdkError } from '@radixdlt/wallet-sdk'
import { ResultAsync } from 'neverthrow'
import { firstValueFrom } from 'rxjs'
import { Logger } from 'tslog'
import { StateSubjects } from '../subjects'

export type GetState = ReturnType<typeof createGetState>
export const createGetState =
  (state$: StateSubjects['state$'], logger?: Logger<unknown>) => () =>
    ResultAsync.fromPromise(
      firstValueFrom(state$),
      (error) => error as SdkError
    ).map((state) => {
      logger?.debug(`getState`, state)
      return state
    })
