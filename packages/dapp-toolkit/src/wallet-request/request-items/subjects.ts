import { RequestItem } from 'radix-connect-common'
import { BehaviorSubject, Subject } from 'rxjs'

export type RequestItemChange = {
  oldValue: RequestItem | undefined
  newValue: RequestItem | undefined
}

export type RequestItemSubjects = ReturnType<typeof RequestItemSubjects>
export const RequestItemSubjects = () => ({
  initialized: new BehaviorSubject<boolean>(false),
  onChange: new Subject<RequestItemChange>(),
})
