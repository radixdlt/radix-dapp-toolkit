import { BehaviorSubject } from 'rxjs'
import { RdtState, rdtStateDefault } from '../io/schemas'

export type StateSubjects = ReturnType<typeof StateSubjects>
export const StateSubjects = () => ({
  state: new BehaviorSubject<RdtState>(rdtStateDefault),
})
