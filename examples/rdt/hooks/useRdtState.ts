import { useEffect, useState } from 'react'
import { useRdt } from './useRdt'
import { RdtState } from '../../../src'

export const useRdtState = () => {
  const rdt = useRdt()
  const [state, setState] = useState<RdtState>()

  useEffect(() => {
    const subscription = rdt.state$.subscribe((state) => {
      setState(state)
    })

    return () => {
      subscription.unsubscribe()
    }
  })

  return state
}
