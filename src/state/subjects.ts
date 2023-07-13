import { BehaviorSubject } from 'rxjs'
import { RdtState } from './types'

export type StateSubjects = ReturnType<typeof StateSubjects>
export const StateSubjects = () => ({
  state: new BehaviorSubject<RdtState>({ walletData: {}, sharedData: {} }),
  initialized: new BehaviorSubject<boolean>(false),
})
