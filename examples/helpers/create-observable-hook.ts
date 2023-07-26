import { useEffect, useState } from 'react'
import { Observable } from 'rxjs'

export const createObservableHook =
  <T = any>(observable: Observable<T>, defaultValue: T) =>
  () => {
    const [state, setState] = useState<T>(defaultValue)
    useEffect(() => {
      const subscription = observable.subscribe(setState)
      return () => {
        subscription.unsubscribe()
      }
    }, [])

    return state
  }
