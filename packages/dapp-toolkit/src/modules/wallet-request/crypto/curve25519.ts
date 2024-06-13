import { x25519, ed25519 } from '@noble/curves/ed25519'
import { Buffer } from 'buffer'
import { Result, err, ok } from 'neverthrow'

const toHex = (input: Uint8Array) => Buffer.from(input).toString('hex')

export type KeyPairProvider = (privateKeyHex?: string) => {
  getPublicKey: () => string
  getPrivateKey: () => string
  calculateSharedSecret: (publicKeyHex: string) => Result<string, Error>
  sign: (messageHex: string) => Result<string, Error>
}

export type Curve25519 = ReturnType<typeof Curve25519>

export const Curve25519: KeyPairProvider = (
  privateKeyHex = toHex(x25519.utils.randomPrivateKey()),
) => {
  const getPrivateKey = () => privateKeyHex

  const getPublicKey = () => toHex(x25519.getPublicKey(privateKeyHex))

  const calculateSharedSecret = (
    publicKeyHex: string,
  ): Result<string, Error> => {
    try {
      return ok(toHex(x25519.getSharedSecret(privateKeyHex, publicKeyHex)))
    } catch (error) {
      return err(error as Error)
    }
  }

  const sign = (messageHex: string): Result<string, Error> => {
    try {
      return ok(toHex(ed25519.sign(privateKeyHex, messageHex)))
    } catch (error) {
      return err(error as Error)
    }
  }

  return { getPublicKey, getPrivateKey, calculateSharedSecret, sign }
}
