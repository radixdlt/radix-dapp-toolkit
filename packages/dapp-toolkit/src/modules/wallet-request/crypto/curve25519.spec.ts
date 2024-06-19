import { describe, expect, it } from 'vitest'
import { Curve25519 } from './curve25519'

const keyPair1 = Curve25519(
  '4181137e23935d9b0e2bc39a798817df6bdddaab415d604801ef76b412f48124',
)
const keyPair2 = Curve25519(
  'c1c117c059232c18263704a500f2e800d5c8e8f63ef7719e9b033602488644dd',
)

const dAppDefinitionAddress =
  'account_tdx_2_12yf9gd53yfep7a669fv2t3wm7nz9zeezwd04n02a433ker8vza6rhe'

describe('Curve25519', () => {
  it('should generate a key pair', () => {
    expect(keyPair1.getPrivateKey()).toBeDefined()
    expect(keyPair1.x25519.getPublicKey()).toBeDefined()
    expect(keyPair1.ed25519.getPublicKey()).toBeDefined()
    expect(keyPair2.getPrivateKey()).toBeDefined()
    expect(keyPair2.x25519.getPublicKey()).toBeDefined()
    expect(keyPair2.ed25519.getPublicKey()).toBeDefined()
  })
  it.only('should calculate a shared secret', () => {
    const sharedSecretResult = keyPair1.x25519.calculateSharedSecret(
      keyPair2.x25519.getPublicKey(),
      dAppDefinitionAddress,
    )

    if (sharedSecretResult.isErr()) throw sharedSecretResult.error

    console.log({
      sharedSecretResult: sharedSecretResult.value,
      keyPair1PrivateKeyKey: keyPair2.x25519.getPublicKey(),
      keyPair2PublicKey: keyPair2.x25519.getPublicKey(),
    })

    expect(sharedSecretResult.value).toBe(
      'e9278143a272e9cce596335d0f29e0194305a2a00b57501bc4c21a432d5c2b49264231657e186b6e70a13da4bbf23be6',
    )
  })
})
