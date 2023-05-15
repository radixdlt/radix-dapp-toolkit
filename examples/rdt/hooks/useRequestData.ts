import { useCallback } from 'react'
import { useRdt } from './useRdt'
import { DataRequestInput } from '../../../src/_types'

export const useRequestData = () => {
  const rdt = useRdt()!

  return useCallback((value: DataRequestInput) => rdt.requestData(value), [rdt])
}
