import { BehaviorSubject } from 'rxjs'
import type { DataRequestBuilderItem, DataRequestState } from './builders'
import { produce } from 'immer'

export type DataRequestStateModule = ReturnType<typeof DataRequestStateModule>
export const DataRequestStateModule = (initialState: DataRequestState) => {
  const state = new BehaviorSubject<DataRequestState>(initialState)

  const reset = () => state.next(initialState)
  const update = (input: DataRequestState) => state.next(input)
  const getState = () => state.getValue()

  const toDataRequestState = (...items: unknown[]): DataRequestState =>
    items
      .filter((item: any): item is any => typeof item._toObject === 'function')
      .reduce(
        (acc, item) => ({
          ...acc,
          ...item._toObject(),
        }),
        {},
      )

  const setState = (...items: DataRequestBuilderItem[]) => {
    if (items.length === 0) reset()
    else {
      update(toDataRequestState(...items))
    }
  }

  const patchState = (...items: DataRequestBuilderItem[]) => {
    if (items.length === 0) return
    update({ ...getState(), ...toDataRequestState(...items) })
  }

  const removeState = (...keys: (keyof DataRequestState)[]) => {
    update(
      produce(getState(), (draft: DataRequestState) => {
        keys.forEach((key) => {
          delete draft[key]
        })
      }),
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
