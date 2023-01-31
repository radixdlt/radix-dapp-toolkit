import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs'

export type ConnectButtonSubjects = ReturnType<typeof ConnectButtonSubjects>
export const ConnectButtonSubjects = () => ({
  onConnect: new Subject<{ challenge: string } | undefined>(),
  onDisconnect: new Subject<void>(),
  loading: new BehaviorSubject<boolean>(false),
  connected: new ReplaySubject<boolean>(),
})
