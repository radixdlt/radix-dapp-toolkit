import { BehaviorSubject } from 'rxjs'
import { DataRequestRawItem, DataRequestState } from './builders'
import { produce } from 'immer'

export type DataRequestStateClient = ReturnType<typeof DataRequestStateClient>
export const DataRequestStateClient = (initialState: DataRequestState) => {
  const state = new BehaviorSubject<DataRequestState>(initialState)

  const reset = () => state.next(initialState)
  const update = (input: DataRequestState) => state.next(input)
  const getState = () => state.getValue()

  const toDataRequestState = (
    ...items: DataRequestRawItem[]
  ): DataRequestState =>
    items.reduce((acc, item) => ({ ...acc, ...item._toObject() }), {})

  const setState = (...items: DataRequestRawItem[]) => {
    if (items.length === 0) reset()
    else {
      update(toDataRequestState(...items))
    }
  }

  const patchState = (...items: DataRequestRawItem[]) => {
    if (items.length === 0) return
    update({ ...getState(), ...toDataRequestState(...items) })
  }

  const removeState = (...keys: (keyof DataRequestState)[]) => {
    update(
      produce(getState(), (draft: DataRequestState) => {
        keys.forEach((key) => {
          delete draft[key]
        })
      })
    )
  }

  return {
    reset,
    setState,
    getState,
    patchState,
    removeState,
    toDataRequestState,
    state$: state.asObservable(),
  }
}
