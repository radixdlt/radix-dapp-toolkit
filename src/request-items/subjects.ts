import { BehaviorSubject, Subject } from 'rxjs'
import { RequestItem } from '../_types'

export type RequestItemSubjects = ReturnType<typeof RequestItemSubjects>
export const RequestItemSubjects = () => ({
  onChange: new Subject<void>(),
  items: new BehaviorSubject<(RequestItem & { id: string })[]>([]),
  pendingItems: new BehaviorSubject<boolean>(false),
})
