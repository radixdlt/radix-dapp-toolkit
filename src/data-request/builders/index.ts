import { boolean, object, z } from 'zod'
import {
  AccountsDataRequest,
  AccountsDataRequestRaw,
  accounts,
} from './accounts'
import { PersonaRequest, PersonaRequestRaw, persona } from './persona'
import {
  PersonaDataRequest,
  PersonaDataRequestRaw,
  personaData,
} from './persona-data'

export type DataRequestRawItem =
  | AccountsDataRequestRaw
  | PersonaDataRequestRaw
  | PersonaRequestRaw

export type DataRequestState = Partial<
  { accounts: AccountsDataRequest } & { personaData: PersonaDataRequest } & {
    persona: PersonaRequest
  }
>

export type ConfigRequestRaw = ReturnType<typeof config>
export type ConfigRequest = z.infer<typeof schema>

const schema = object({
  withProof: boolean().optional(),
})

export const config = (data: DataRequestState) => {
  const _toObject = () => ({ ...data })

  const methods = {
    _toObject,
  }

  return methods
}

export const DataRequestBuilder = {
  accounts,
  persona,
  personaData,
  config,
} as const
