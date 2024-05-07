import { produce } from 'immer'
import { boolean, object, Output, optional } from 'valibot'

export type PersonaRequestBuilder = {
  withProof: (value?: boolean) => PersonaRequestBuilder
}
export type PersonaRequest = Output<typeof schema>

const schema = object({
  withProof: optional(boolean()),
})

export const persona = (
  initialData: PersonaRequest = {
    withProof: false,
  },
) => {
  let data: PersonaRequest = produce(initialData, () => {})

  const withProof = (value = true) => {
    data = produce(data, (draft) => {
      draft.withProof = value
    })
    return methods
  }

  const _toObject = (): { persona: PersonaRequest } => ({
    persona: data,
  })

  const methods = {
    withProof,
    _toObject,
  }

  return methods
}
