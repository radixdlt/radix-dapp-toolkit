import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import type { Observable } from 'rxjs'
import { map, merge, of, Subject, switchMap, timer } from 'rxjs'

export type ExponentialBackoffInput = {
  multiplier?: number
  maxDelayTime?: number
  timeout?: number | Date
  interval?: number
}
export type ExponentialBackoff = typeof ExponentialBackoff
export const ExponentialBackoff = ({
  maxDelayTime = 10_000,
  multiplier = 2,
  timeout,
  interval = 2_000,
}: ExponentialBackoffInput = {}) => {
  const trigger = new Subject<void>()
  const stop = new Subject<void>()
  let numberOfRetries = 0

  const backoff$ = merge(
    of(0),
    trigger.pipe(
      map(() => {
        numberOfRetries = numberOfRetries + 1
        return numberOfRetries
      }),
    ),
  ).pipe(
    switchMap((numberOfRetries) => {
      const delayTime = numberOfRetries * interval * multiplier
      const delay = delayTime > maxDelayTime ? maxDelayTime : delayTime
      return timer(delay).pipe(map(() => ok(numberOfRetries)))
    }),
  )

  const withBackoffAndTimeout$: Observable<Result<number, { error: string }>> =
    merge(
      stop.asObservable().pipe(map(() => err({ error: 'stopped' }))),
      timeout
        ? merge(
            backoff$,
            timer(timeout).pipe(map(() => err({ error: 'timeout' }))),
          )
        : backoff$,
    )

  return {
    trigger,
    withBackoff$: withBackoffAndTimeout$,
    stop: () => stop.next(),
  }
}
