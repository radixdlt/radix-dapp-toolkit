import { Subject, map, merge, scan, shareReplay } from 'rxjs'
import { createObservableHook } from '../helpers/create-observable-hook'

export const logSubject = new Subject<string>()
export const clearLogsSubject = new Subject<void>()

export const appLogger = {
  debug: (...rest: any) =>
    logSubject.next(
      rest
        .map((item) =>
          typeof item === 'object' ? JSON.stringify(item, null, 2) : item
        )
        .join(' ')
    ),
  error: (...rest: any) =>
    logSubject.next(
      rest
        .map((item) =>
          typeof item === 'object' ? JSON.stringify(item, null, 2) : item
        )
        .join(' ')
    ),
  trace: (...rest: any) => {
    // return logSubject.next(
    //   rest
    //     .map((item) => typeof item === 'object' ? JSON.stringify(item, null, 2) : item
    //     )
    //     .join(' ')
    // )
  },
} as const

const logs$ = merge(
  clearLogsSubject.pipe(map(() => [] as string[])),
  logSubject.pipe(
    scan(
      (acc, curr: string) => [
        ...acc,
        `[${new Date().toLocaleTimeString()}] ${curr}`,
      ],
      [] as string[]
    )
  )
).pipe(shareReplay(1))

export const useLogs = createObservableHook(logs$, [])
