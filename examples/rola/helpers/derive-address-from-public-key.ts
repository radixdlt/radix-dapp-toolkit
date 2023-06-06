import { ManifestAstValue, PublicKey } from '@radixdlt/radix-engine-toolkit'
import { ResultAsync, err, errAsync } from 'neverthrow'
import { SignedChallenge } from '../../../src/io/schemas'

const deriveVirtualIdentityAddress = (publicKey: string, networkId: number) =>
  ResultAsync.fromPromise(
    ManifestAstValue.Address.virtualIdentityAddress(
      new PublicKey.EddsaEd25519(publicKey),
      networkId /* The ID of the network to derive the address for. */
    ),
    (error: any): Error => error
  )

const deriveVirtualEddsaEd25519AccountAddress = (
  publicKey: string,
  networkId: number
) =>
  ResultAsync.fromPromise(
    ManifestAstValue.Address.virtualAccountAddress(
      new PublicKey.EddsaEd25519(publicKey),
      networkId /* The ID of the network to derive the address for. */
    ),
    (error: any): Error => error
  )

const deriveVirtualEcdsaSecp256k1AccountAddress = (
  publicKey: string,
  networkId: number
) =>
  ResultAsync.fromPromise(
    ManifestAstValue.Address.virtualAccountAddress(
      new PublicKey.EcdsaSecp256k1(publicKey),
      networkId /* The ID of the network to derive the address for. */
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
