import {
  AccountsDataRequest,
  AccountsRequestBuilder,
  OneTimeAccountsRequestBuilder,
  accounts,
} from './accounts'
import { PersonaRequest, PersonaRequestBuilder, persona } from './persona'
import {
  OneTimePersonaDataRequestBuilder,
  PersonaDataRequest,
  PersonaDataRequestBuilder,
  personaData,
} from './persona-data'

export type DataRequestBuilderItem =
  | AccountsRequestBuilder
  | PersonaDataRequestBuilder
  | PersonaRequestBuilder
  | ConfigRequestBuilder

export type OneTimeDataRequestBuilderItem =
  | OneTimeAccountsRequestBuilder
  | OneTimePersonaDataRequestBuilder

export type DataRequestState = Partial<
  { accounts: AccountsDataRequest } & { personaData: PersonaDataRequest } & {
    persona: PersonaRequest
  }
>

export type ConfigRequestBuilder = {}

export const config = (data: DataRequestState) => {
  const _toObject = () => ({ ...data })

  const methods = {
    _toObject,
  }

  return methods
}

export type DataRequestBuilder = {
  accounts: () => AccountsRequestBuilder
  personaData: () => PersonaDataRequestBuilder
  persona: () => PersonaRequestBuilder
  config: (input: DataRequestState) => ConfigRequestBuilder
}

export const DataRequestBuilder: DataRequestBuilder = {
  accounts,
  personaData,
  persona,
  config,
}

export type OneTimeDataRequestBuilder = {
  accounts: () => OneTimeAccountsRequestBuilder
  personaData: () => OneTimePersonaDataRequestBuilder
}

export const OneTimeDataRequestBuilder: OneTimeDataRequestBuilder = {
  accounts,
  personaData,
}
