import { produce } from 'immer'
import { boolean, object, InferOutput, optional } from 'valibot'
import { NumberOfValues } from '../../../../schemas'

export type AccountsRequestBuilder = {
  atLeast: (n: number) => AccountsRequestBuilder
  exactly: (n: number) => AccountsRequestBuilder
  withProof: (value?: boolean) => AccountsRequestBuilder
  reset: (value?: boolean) => AccountsRequestBuilder
}
export type OneTimeAccountsRequestBuilder = {
  atLeast: (n: number) => OneTimeAccountsRequestBuilder
  exactly: (n: number) => OneTimeAccountsRequestBuilder
  withProof: (value?: boolean) => OneTimeAccountsRequestBuilder
}
export type AccountsDataRequest = InferOutput<typeof AccountsDataRequestSchema>

export const AccountsDataRequestSchema = object({
  numberOfAccounts: NumberOfValues,
  withProof: optional(boolean()),
  reset: optional(boolean()),
})

export const accounts: () => AccountsRequestBuilder = () => {
  const defaultValue: AccountsDataRequest = {
    numberOfAccounts: { quantifier: 'atLeast', quantity: 1 },
  }

  let data: AccountsDataRequest = produce(defaultValue, () => {})

  const atLeast = (n: number) => {
    data = produce(data, (draft) => {
      draft.numberOfAccounts.quantifier = 'atLeast'
      draft.numberOfAccounts.quantity = n
    })
    return methods
  }

  const exactly = (n: number) => {
    data = produce(data, (draft) => {
      draft.numberOfAccounts.quantifier = 'exactly'
      draft.numberOfAccounts.quantity = n
    })
    return methods
  }

  const reset = (value = true) => {
    data = produce(data, (draft) => {
      draft.reset = value
    })
    return methods
  }

  const withProof = (value = true) => {
    data = produce(data, (draft) => {
      draft.withProof = value
    })
    return methods
  }

  const _toObject = (): { accounts: AccountsDataRequest } => ({
    accounts: data,
  })

  const methods = {
    atLeast,
    exactly,
    withProof,
    reset,
    _toObject,
  }

  return methods
}
