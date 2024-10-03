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
import { proofOfOwnership, ProofOfOwnershipRequest, ProofOfOwnershipRequestBuilder } from './proof-of-ownership'

export type DataRequestBuilderItem =
  | AccountsRequestBuilder
  | PersonaDataRequestBuilder
  | PersonaRequestBuilder
  | ConfigRequestBuilder

export type OneTimeDataRequestBuilderItem =
  | OneTimeAccountsRequestBuilder
  | OneTimePersonaDataRequestBuilder
  | ProofOfOwnershipRequestBuilder

export type DataRequestState = Partial<{
  accounts: AccountsDataRequest
  personaData: PersonaDataRequest
  persona: PersonaRequest
  proofOfOwnership: ProofOfOwnershipRequest
}>

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
  personaData: (input?: PersonaDataRequest) => PersonaDataRequestBuilder
  persona: (input?: PersonaRequest) => PersonaRequestBuilder
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
  personaData: (input?: PersonaDataRequest) => OneTimePersonaDataRequestBuilder
  proofOfOwnership: () => ProofOfOwnershipRequestBuilder
}

export const OneTimeDataRequestBuilder: OneTimeDataRequestBuilder = {
  accounts,
  personaData,
  proofOfOwnership,
}
