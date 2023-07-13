import { ResultAsync, err, errAsync, ok } from 'neverthrow'
import { createSignatureMessage } from './helpers/create-signature-message'
import { verifyProofFactory } from './helpers/verify-proof'
import { deriveVirtualAddress } from './helpers/derive-address-from-public-key'
import { GatewayService } from './gateway'
import { createPublicKeyHash } from './helpers/create-public-key-hash'
import { SignedChallenge } from '../../src'

export type RolaError = { reason: string; jsError?: Error }

export type VerifyOwnerKeyOnLedgerFn = (
  address: string,
  publicKeyHex: string
) => ResultAsync<undefined, RolaError>

export const RolaFactory =
  ({
    gatewayService,
    expectedOrigin,
    dAppDefinitionAddress,
    networkId,
  }: {
    gatewayService: GatewayService
    expectedOrigin: string
    dAppDefinitionAddress: string
    networkId: number
  }) =>
  (signedChallenge: SignedChallenge): ResultAsync<any, RolaError> => {
    const result = createPublicKeyHash(signedChallenge.proof.publicKey)

    if (result.isErr()) return errAsync({ reason: 'couldNotHashPublicKey' })

    const hashedPublicKey = result.value

    const verifyProof = verifyProofFactory(signedChallenge)

    const getDerivedAddress = () =>
      deriveVirtualAddress(signedChallenge, networkId)
        .map(({ value }) => value)
        .mapErr((jsError) => ({
          reason: 'couldNotDeriveAddressFromPublicKey',
          jsError,
        }))

    const queryLedger = () =>
      gatewayService
        .getEntityOwnerKeys(signedChallenge.address)
        .mapErr(() => ({ reason: 'couldNotVerifyPublicKeyOnLedger' }))
        .map((ownerKeys) => ({
          ownerKeysMatchesProvidedPublicKey:
            ownerKeys.includes(hashedPublicKey),
          ownerKeysSet: !!ownerKeys,
        }))

    const deriveAddressFromPublicKeyAndQueryLedger = () =>
      ResultAsync.combine([getDerivedAddress(), queryLedger()])

    return createSignatureMessage({
      dAppDefinitionAddress,
      origin: expectedOrigin,
      challenge: signedChallenge.challenge,
    })
      .andThen(verifyProof)
      .asyncAndThen(deriveAddressFromPublicKeyAndQueryLedger)
      .andThen(
        ([
          derivedAddress,
          { ownerKeysMatchesProvidedPublicKey, ownerKeysSet },
        ]) => {
          const derivedAddressMatchesPublicKey =
            !ownerKeysSet && derivedAddress === signedChallenge.address

          return ownerKeysMatchesProvidedPublicKey ||
            derivedAddressMatchesPublicKey
            ? ok(undefined)
            : err({ reason: 'invalidPublicKey' })
        }
      )
  }
