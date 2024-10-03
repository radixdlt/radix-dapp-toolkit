import { produce } from 'immer'
import { object, InferOutput, string, array, optional } from 'valibot'

export type ProofOfOwnershipRequestBuilder = {
  accounts: (value: string[]) => ProofOfOwnershipRequestBuilder
  identity: (value: string) => ProofOfOwnershipRequestBuilder
}
export type ProofOfOwnershipRequest = InferOutput<typeof schema>

const schema = object({
  accountAddresses: optional(array(string())),
  identityAddress: optional(string()),
})

export const proofOfOwnership = (initialData: ProofOfOwnershipRequest = {}) => {
  let data: ProofOfOwnershipRequest = produce(initialData, () => {})

  const accounts = (value: string[]) => {
    data = produce(data, (draft) => {
      draft.accountAddresses = value
    })
    return methods
  }

  const identity = (value: string) => {
    data = produce(data, (draft) => {
      draft.identityAddress = value
    })
    return methods
  }

  const _toObject = (): { proofOfOwnership: ProofOfOwnershipRequest } => ({
    proofOfOwnership: data,
  })

  const methods = {
    accounts,
    identity,
    _toObject,
  }

  return methods
}
