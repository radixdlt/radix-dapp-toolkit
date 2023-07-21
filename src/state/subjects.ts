import { BehaviorSubject } from 'rxjs'
import { RdtState, walletDataDefault } from './types'

export type StateSubjects = ReturnType<typeof StateSubjects>
export const StateSubjects = () => ({
  state: new BehaviorSubject<RdtState>({
    walletData: walletDataDefault,
    sharedData: {},
  }),
  initialized: new BehaviorSubject<boolean>(false),
})
