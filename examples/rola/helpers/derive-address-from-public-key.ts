import { ManifestAstValue, PublicKey } from '@radixdlt/radix-engine-toolkit'
import { ResultAsync } from 'neverthrow'

export const deriveVirtualIdentityAddress = (
  publicKey: string,
  networkId: number
) =>
  ResultAsync.fromPromise(
    ManifestAstValue.Address.virtualIdentityAddress(
      new PublicKey.EddsaEd25519(publicKey),
      networkId /* The ID of the network to derive the address for. */
    ),
    (error: any): Error => error
  )
