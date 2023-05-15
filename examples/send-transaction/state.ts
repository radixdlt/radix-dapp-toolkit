import { BehaviorSubject } from 'rxjs'
import { createObservableHook } from '../helpers/create-observable-hook'

type TransactionHistoryItem = {
  transactionManifest: string
  message: string
  id: string
}

const getTransactionHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('transactionHistory') || '[]')
  } catch (_) {
    return []
  }
}

const transactionHistory = new BehaviorSubject<
  {
    transactionManifest: string
    id: string
    message: string
  }[]
>(getTransactionHistory())

export const addItemToTransactionHistory = (
  item: Omit<TransactionHistoryItem, 'id'>
) => {
  const prev = transactionHistory.value
  const updated = [{ ...item, id: crypto.randomUUID() }, ...prev].slice(0, 10)
  transactionHistory.next(updated)
  localStorage.setItem('transactionHistory', JSON.stringify(updated))
}

export const useTransactionHistory = createObservableHook<
  TransactionHistoryItem[]
>(transactionHistory, getTransactionHistory())
