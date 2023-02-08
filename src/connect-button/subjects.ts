import { Account, RequestItem } from '@radixdlt/connect-button'
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs'

export type ConnectButtonSubjects = ReturnType<typeof ConnectButtonSubjects>
export const ConnectButtonSubjects = () => ({
  onConnect: new Subject<{ challenge: string } | undefined>(),
  onDisconnect: new Subject<void>(),
  loading: new BehaviorSubject<boolean>(false),
  connected: new ReplaySubject<boolean>(),
  requestItems: new BehaviorSubject<RequestItem[]>([]),
  onCancelRequestItem: new Subject<string>(),
  accounts: new BehaviorSubject<Account[]>([]),
  connecting: new BehaviorSubject(false),
  showNotification: new BehaviorSubject(false),
  personaLabel: new BehaviorSubject<string>(''),
})
