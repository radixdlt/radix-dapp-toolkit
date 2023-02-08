import { RequestItem } from '@radixdlt/connect-button'
import { BehaviorSubject, Subject } from 'rxjs'

export type RequestItemSubjects = ReturnType<typeof RequestItemSubjects>
export const RequestItemSubjects = () => ({
  onChange: new Subject<void>(),
  items: new BehaviorSubject<RequestItem[]>([]),
  pendingItems: new BehaviorSubject<boolean>(false),
})
