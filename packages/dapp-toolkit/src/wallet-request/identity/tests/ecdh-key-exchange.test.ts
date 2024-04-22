import { describe, it, expect } from 'vitest'
import { testVectors } from './test-vectors/shared-secret-derivation'
import { Curve25519 } from '../../crypto'

describe('ECDH key exchange', () => {
  it('should calculate shared secret', () => {
    for (const { privateKey1, publicKey2, sharedSecret } of testVectors) {
      expect(
        Curve25519(privateKey1)
          .calculateSharedSecret(publicKey2)
          ._unsafeUnwrap(),
      ).toBe(sharedSecret)
    }
  })
})
