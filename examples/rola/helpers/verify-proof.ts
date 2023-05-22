import { Result, err, ok } from 'neverthrow'
import { curve25519 } from '../crypto/curve25519'
import { SignedChallenge } from '../../../src/io/schemas'

export const verifyProofFactory =
  (input: SignedChallenge) =>
  (
    signatureMessageHex: string
  ): Result<undefined, { reason: string; jsError?: Error }> => {
    if (input.proof.curve === 'curve25519') {
      try {
        // @ts-ignore: incorrect type definition in EC lib
        const publicKey = curve25519.keyFromPublic(input.proof.publicKey, 'hex')

        const isValid = publicKey.verify(
          signatureMessageHex,
          input.proof.signature
        )
        return isValid ? ok(undefined) : err({ reason: 'invalidSignature' })
      } catch (error: any) {
        return err({ reason: 'invalidPublicKey', jsError: error })
      }
    }

    return err({ reason: 'unsupportedCurve' })
  }
