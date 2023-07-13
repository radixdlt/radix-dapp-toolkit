import {
  AccountsDataRequest,
  AccountsDataRequestRaw,
} from './builders/accounts'
import {
  PersonaDataRequest,
  PersonaDataRequestRaw,
} from './builders/persona-data'
import { PersonaRequest, PersonaRequestRaw } from './builders/persona'

export type DataRequestRawItem =
  | AccountsDataRequestRaw
  | PersonaDataRequestRaw
  | PersonaRequestRaw

export type DataRequestState = Partial<
  { accounts: AccountsDataRequest } & { personaData: PersonaDataRequest } & {
    persona: PersonaRequest
  }
>
