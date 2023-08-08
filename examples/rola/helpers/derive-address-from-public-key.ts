import { RadixEngineToolkit } from '@radixdlt/radix-engine-toolkit'
import { ResultAsync, errAsync } from 'neverthrow'
import { SignedChallenge } from '../../../src'

const deriveVirtualIdentityAddress = (publicKey: string, networkId: number) =>
  ResultAsync.fromPromise(
    RadixEngineToolkit.Derive.virtualIdentityAddressFromPublicKey(
      { kind: 'Ed25519', publicKey: Buffer.from(publicKey, 'hex') },
      networkId
    ),
    (error: any): Error => error
  )

const deriveVirtualEddsaEd25519AccountAddress = (
  publicKey: string,
  networkId: number
) =>
  ResultAsync.fromPromise(
    RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(
      { kind: 'Ed25519', publicKey: Buffer.from(publicKey, 'hex') },
      networkId
    ),
    (error: any): Error => error
  )

const deriveVirtualEcdsaSecp256k1AccountAddress = (
  publicKey: string,
  networkId: number
) =>
  ResultAsync.fromPromise(
    RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(
      { kind: 'Secp256k1', publicKey: Buffer.from(publicKey, 'hex') },
      networkId
    ),
    (error: any): Error => error
  )

export const deriveVirtualAddress = (
  signedChallenge: SignedChallenge,
  networkId: number
) => {
  if (signedChallenge.type === 'persona')
    return deriveVirtualIdentityAddress(
      signedChallenge.proof.publicKey,
      networkId
    )
  else if (
    signedChallenge.type === 'account' &&
    signedChallenge.proof.curve === 'curve25519'
  )
    return deriveVirtualEddsaEd25519AccountAddress(
      signedChallenge.proof.publicKey,
      networkId
    )
  else if (
    signedChallenge.type === 'account' &&
    signedChallenge.proof.curve === 'secp256k1'
  )
    return deriveVirtualEcdsaSecp256k1AccountAddress(
      signedChallenge.proof.publicKey,
      networkId
    )

  return errAsync(new Error('Could not derive virtual address'))
}
