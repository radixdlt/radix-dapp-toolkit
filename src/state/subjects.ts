import { Account } from '@radixdlt/wallet-sdk/dist/IO/schemas'
import { ReplaySubject, Subject } from 'rxjs'
import { State } from '../_types'

export type StateSubjects = ReturnType<typeof StateSubjects>
export const StateSubjects = () => ({
  connected: new ReplaySubject<boolean>(1),
  accounts: new ReplaySubject<Account[] | undefined>(1),
  persona: new ReplaySubject<
    | {
        identityAddress: string
        label: string
      }
    | undefined
  >(),
  onInit: new ReplaySubject<State>(1),
  state$: new ReplaySubject<State>(1),
  setState: new Subject<{ state: Partial<State>; persist: boolean }>(),
  updateSharedData: new Subject<void>(),
})
