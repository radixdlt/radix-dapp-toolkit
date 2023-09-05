import { BehaviorSubject } from 'rxjs'
import { createObservableHook } from '../helpers/create-observable-hook'
import { TransactionStatus } from '@radixdlt/babylon-gateway-api-sdk'

const POOLS_STATE_KEY = 'poolsState'

export type InstantiatedPool = {
  address: string
  poolUnit: string
  resources: string[]
  transactions: {
    transactionIntentHash: string
    status: TransactionStatus
  }[]
}

export type PoolsState = Record<string, InstantiatedPool>

const getPoolsState = (): PoolsState => {
  try {
    const raw = localStorage.getItem(POOLS_STATE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown as PoolsState
    return parsed
  } catch (_) {
    return {}
  }
}

export const poolsState = new BehaviorSubject<PoolsState>(getPoolsState())

export const usePoolsState = createObservableHook(poolsState, getPoolsState())

export const setPoolsState = (value: PoolsState) => {
  localStorage.setItem(POOLS_STATE_KEY, JSON.stringify(value))
  poolsState.next(value)
}

export const addPoolComponent = (value: InstantiatedPool) => {
  const state = getPoolsState()
  state[value.address] = value
  setPoolsState(state)
}

export const rememberPoolTransaction = (
  poolAddress: string,
  transaction: {
    transactionIntentHash: string
    status: TransactionStatus
  }
) => {
  const state = getPoolsState()
  state[poolAddress].transactions.unshift(transaction)
  setPoolsState(state)
}

export const removePoolComponent = ({ address }: InstantiatedPool) => {
  const state = getPoolsState()
  delete state[address]
  setPoolsState(state)
}
