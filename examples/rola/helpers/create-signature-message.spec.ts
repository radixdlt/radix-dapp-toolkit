import { createSignatureMessage } from './create-signature-message'
import { rolaTestVectors } from './vectors'

describe('createSignatureMessage', () => {
  it('should create a signature message', () => {
    rolaTestVectors.forEach((vector) => {
      const result = createSignatureMessage({
        dAppDefinitionAddress: vector.dAppDefinitionAddress,
        origin: vector.origin,
        challenge: vector.challenge,
      })

      if (result.isErr()) throw { ...result.error, vector }

      expect(result.value).toEqual(vector.blakeHashOfPayload)
    })
  })
})
