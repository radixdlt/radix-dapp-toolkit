import { produce } from 'immer'
import { boolean, object, InferOutput, partial } from 'valibot'
import { NumberOfValues } from '../../../../schemas'

export type PersonaDataRequestBuilder = {
  fullName: (value?: boolean) => PersonaDataRequestBuilder
  emailAddresses: (value?: boolean) => PersonaDataRequestBuilder
  phoneNumbers: (value?: boolean) => PersonaDataRequestBuilder
  reset: (value?: boolean) => PersonaDataRequestBuilder
}
export type OneTimePersonaDataRequestBuilder = {
  fullName: (value?: boolean) => PersonaDataRequestBuilder
  emailAddresses: (value?: boolean) => PersonaDataRequestBuilder
  phoneNumbers: (value?: boolean) => PersonaDataRequestBuilder
}
export type PersonaDataRequest = InferOutput<typeof PersonaDataRequestSchema>

export const PersonaDataRequestSchema = partial(
  object({
    fullName: boolean(),
    emailAddresses: NumberOfValues,
    phoneNumbers: NumberOfValues,
    reset: boolean(),
  }),
)

export const personaData = (initialData: PersonaDataRequest = {}) => {
  let data: PersonaDataRequest = produce(initialData, () => {})

  const fullName = (value = true) => {
    data = produce(data, (draft) => {
      draft.fullName = value
    })

    return methods
  }

  const createNumberOfValuesOptions = (
    key: 'emailAddresses' | 'phoneNumbers',
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

  const emailAddresses = (value = true) => {
    const options = createNumberOfValuesOptions('emailAddresses')

    options.exactly(value ? 1 : 0)
    return methods
  }
  const phoneNumbers = (value = true) => {
    const options = createNumberOfValuesOptions('phoneNumbers')
    options.exactly(value ? 1 : 0)
    return methods
  }

  const reset = (value = true) => {
    data = produce(data, (draft) => {
      draft.reset = value
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
