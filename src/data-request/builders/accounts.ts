import { NumberOfValues } from '@radixdlt/wallet-sdk'
import { produce } from 'immer'
import { boolean, object, z } from 'zod'

export type AccountsDataRequestRaw = ReturnType<typeof accounts>
export type AccountsDataRequest = z.infer<typeof AccountsDataRequestSchema>

export const AccountsDataRequestSchema = object({
  numberOfAccounts: NumberOfValues,
  withProof: boolean().optional(),
  reset: boolean().optional(),
})

export const accounts = () => {
  let data: AccountsDataRequest = produce(
    { numberOfAccounts: { quantifier: 'atLeast', quantity: 1 } },
    () => {}
  )

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
