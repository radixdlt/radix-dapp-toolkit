import { createObservableHook } from '../helpers/create-observable-hook'
import { rdt } from '../rdt/rdt'
import { DataRequestState } from '../../src'

export const useDataRequestState = createObservableHook<DataRequestState>(
  rdt.walletData.requestDataState$,
  {}
)
