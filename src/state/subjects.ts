import { BehaviorSubject } from 'rxjs'
import { SharedData, WalletData, walletDataDefault } from './types'

export type StateSubjects = ReturnType<typeof StateSubjects>
export const StateSubjects = () => ({
  walletData: new BehaviorSubject<WalletData>(walletDataDefault),
  sharedData: new BehaviorSubject<SharedData>({}),
  loggedInTimestamp: new BehaviorSubject<string>(''),
  initialized: new BehaviorSubject<boolean>(false),
})
