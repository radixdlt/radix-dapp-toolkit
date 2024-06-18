import { x25519, ed25519 } from '@noble/curves/ed25519'
import { Buffer } from 'buffer'
import { Result, err, ok } from 'neverthrow'

const toHex = (input: Uint8Array) => Buffer.from(input).toString('hex')

export type KeyPairProvider = (privateKeyHex?: string) => {
  getPrivateKey: () => string
  x25519: {
    getPublicKey: () => string
    calculateSharedSecret: (publicKeyHex: string) => Result<string, Error>
  }
  ed25519: {
    getPublicKey: () => string
    sign: (messageHex: string) => Result<string, Error>
  }
}

export type Curve25519 = ReturnType<typeof Curve25519>

export const Curve25519: KeyPairProvider = (
  privateKeyHex = toHex(x25519.utils.randomPrivateKey()),
) => {
  const getPrivateKey = () => privateKeyHex
  const x25519Api = {
    getPublicKey: () => toHex(x25519.getPublicKey(privateKeyHex)),
    calculateSharedSecret: (publicKeyHex: string): Result<string, Error> => {
      try {
        return ok(toHex(x25519.getSharedSecret(privateKeyHex, publicKeyHex)))
      } catch (error) {
        return err(error as Error)
      }
    },
  } as const

  const ed25519Api = {
    getPublicKey: () => toHex(ed25519.getPublicKey(privateKeyHex)),
    sign: (messageHex: string): Result<string, Error> => {
      try {
        return ok(toHex(ed25519.sign(messageHex, privateKeyHex)))
      } catch (error) {
        return err(error as Error)
      }
    },
  } as const

  return {
    getPrivateKey,
    x25519: x25519Api,
    ed25519: ed25519Api,
  }
}
