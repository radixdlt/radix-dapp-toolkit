import { Account } from '@radixdlt/wallet-sdk/dist/IO/schemas'
import { ReplaySubject, Subject } from 'rxjs'
import { State } from '../_types'

export type StateSubjects = ReturnType<typeof StateSubjects>
export const StateSubjects = () => ({
  connected: new ReplaySubject<boolean>(),
  accounts: new ReplaySubject<Account[] | undefined>(),
  persona: new ReplaySubject<
    | {
        identityAddress: string
        label: string
      }
    | undefined
  >(),
  onInit: new ReplaySubject<State>(),
  state$: new ReplaySubject<State>(),
  setState: new Subject<{ state: Partial<State>; persist: boolean }>(),
})
