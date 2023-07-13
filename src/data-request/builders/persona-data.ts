import { NumberOfValues } from '@radixdlt/wallet-sdk'
import { produce } from 'immer'
import { boolean, object, z } from 'zod'

export type PersonaDataRequestRaw = ReturnType<typeof personaData>
export type PersonaDataRequest = z.infer<typeof PersonaDataRequestSchema>

export const PersonaDataRequestSchema = object({
  fullName: boolean(),
  emailAddresses: NumberOfValues,
  phoneNumbers: NumberOfValues,
  reset: boolean(),
}).partial()

export const personaData = (initialData: PersonaDataRequest = {}) => {
  let data: PersonaDataRequest = produce(initialData, () => {})

  const fullName = (value: boolean) => {
    data = produce(data, (draft) => {
      draft.fullName = value
    })

    return methods
  }

  const createNumberOfValuesOptions = (
    key: 'emailAddresses' | 'phoneNumbers'
  ) => ({
    atLeast: (n: number) => {
      data = produce(data, (draft) => {
        draft[key] = { quantifier: 'atLeast', quantity: n }
      })
      return methods
    },

    exactly: (n: number) => {
      data = produce(data, (draft) => {
        draft[key] = { quantifier: 'exactly', quantity: n }
      })
      return methods
    },
  })

  const emailAddresses = (value: boolean) => {
    const options = createNumberOfValuesOptions('emailAddresses')

    options.exactly(value ? 1 : 0)
    return methods
  }
  const phoneNumbers = (value: boolean) => {
    const options = createNumberOfValuesOptions('phoneNumbers')
    options.exactly(value ? 1 : 0)
    return methods
  }

  const reset = () => {
    data = produce(data, (draft) => {
      draft.reset = true
    })
    return methods
  }

  const _toObject = (): { personaData: PersonaDataRequest } => ({
    personaData: data,
  })

  const methods = {
    fullName,
    emailAddresses,
    phoneNumbers,
    reset,
    _toObject,
  }

  return methods
}
