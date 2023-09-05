import { createObservableHook } from '../helpers/create-observable-hook'
import { dataRequestStateClient } from '../rdt/rdt'
import { DataRequestState } from '../../src'

export const useDataRequestState = createObservableHook<DataRequestState>(
  dataRequestStateClient.state$,
  {}
)
