import { ManifestAstValue, PublicKey } from '@radixdlt/radix-engine-toolkit'
import { Result, ResultAsync, err, errAsync, ok } from 'neverthrow'
import { createSignatureMessage } from './create-signature-message'
import { Buffer } from 'buffer'
import { curve25519 } from './curve25519'

const createDeriveVirtualIdentityAddressFromPublicKey =
  (publicKey: PublicKey.EddsaEd25519, networkId: number) => () =>
    ResultAsync.fromPromise(
      ManifestAstValue.Address.virtualIdentityAddress(publicKey, networkId),
      (error) => error as Error
    )

const addressType = { identity: 'identity', account: 'account' } as const
type AddressType = keyof typeof addressType

export const Rola = ({
  publicKeyHex,
  networkId,
  curve,
  addressType,
  address,
  challenge,
  dAppDefinitionAddress,
  signature,
  metadataPublicKeys,
}: {
  publicKeyHex: string
  networkId: number
  curve: string
  addressType: AddressType
  address: string
  challenge: string
  dAppDefinitionAddress: string
  origin: string
  signature: string
  metadataPublicKeys: string[]
}): ResultAsync<boolean, { reason: string }> => {
  const supportedCurves = {
    curve25519: {
      // @ts-ignore
      publicKey: curve25519.keyFromPublic(publicKeyHex, 'hex'),
      deriveVirtualIdentityAddressFromPublicKey:
        createDeriveVirtualIdentityAddressFromPublicKey(
          new PublicKey.EddsaEd25519(publicKeyHex),
          networkId
        ),
    },
  } as const

  const Algo = supportedCurves[curve]
  if (!Algo) return errAsync({ reason: `UnsupportedCurve` })

  if (addressType !== 'identity')
    return errAsync({ reason: 'UnsupportedAddressType' })

  const { publicKey, deriveVirtualIdentityAddressFromPublicKey } =
    supportedCurves[curve] as (typeof supportedCurves)['curve25519']

  const verifySignature = () =>
    createSignatureMessage(
      Buffer.from(challenge, 'hex'),
      dAppDefinitionAddress,
      origin
    ).map((msgHash) => publicKey.verify(msgHash.toString('hex'), signature))

  return deriveVirtualIdentityAddressFromPublicKey()
    .mapErr(() => ({
      reason: 'CouldNotDeriveAddressFromPublicKey',
    }))
    .andThen((deriveVirtualAddress) =>
      deriveVirtualAddress.address === address
        ? ok(true)
        : err({ reason: 'DerivedAddressMissMatch' })
    )
    .andThen(() => verifySignature())
    .mapErr(() => ({
      reason: 'CouldNotVerifySignature',
    }))
}
