import { NumberOfValues } from '@radixdlt/wallet-sdk'
import { produce } from 'immer'
import { boolean, object, z } from 'zod'

export type AccountsRequestBuilder = {
  atLeast: (n: number) => AccountsRequestBuilder
  exactly: (n: number) => AccountsRequestBuilder
  withProof: (value?: boolean) => AccountsRequestBuilder
  reset: (value?: boolean) => AccountsRequestBuilder
}
export type AccountsDataRequest = z.infer<typeof AccountsDataRequestSchema>

export const AccountsDataRequestSchema = object({
  numberOfAccounts: NumberOfValues,
  withProof: boolean().optional(),
  reset: boolean().optional(),
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
