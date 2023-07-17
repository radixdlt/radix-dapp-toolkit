import { useCallback } from 'react'
import { useRdt } from './useRdt'

export const useRequestData = () => {
  const rdt = useRdt()!

  return useCallback(() => rdt.walletData.sendRequest(), [rdt])
}
