import { NumberOfValues } from '@radixdlt/wallet-sdk'
import { produce } from 'immer'
import { boolean, object, z } from 'zod'

export type AccountsDataRequestRaw = ReturnType<typeof accounts>
export type AccountsDataRequest = z.infer<typeof AccountsDataRequestSchema>

export const AccountsDataRequestSchema = object({
  numberOfAccounts: NumberOfValues,
  withProof: boolean(),
  reset: boolean(),
})

export const accounts = (
  initialData: AccountsDataRequest = {
    withProof: false,
    reset: false,
    numberOfAccounts: { quantifier: 'atLeast', quantity: 1 },
  }
) => {
  let data: AccountsDataRequest = produce(initialData, () => {})

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
