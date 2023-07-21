import { produce } from 'immer'
import { boolean, object, z } from 'zod'

export type PersonaRequestBuilder = {
  withProof: (value?: boolean) => PersonaRequestBuilder
}
export type PersonaRequest = z.infer<typeof schema>

const schema = object({
  withProof: boolean().optional(),
})

export const persona = (
  initialData: PersonaRequest = {
    withProof: false,
  }
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
