import { ResultAsync, err, ok } from 'neverthrow'
import { createSignatureMessage } from './helpers/create-signature-message'
import { verifyProofFactory } from './helpers/verify-proof'
import { deriveVirtualAddress } from './helpers/derive-address-from-public-key'
import { SignedChallenge } from '../../src/io/schemas'
import { GatewayService } from './gateway'

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
    const formattedPublicKey =
      signedChallenge.proof.curve === 'curve25519'
        ? `EddsaEd25519PublicKey("${signedChallenge.proof.publicKey}")`
        : `Secp256k1PublicKey("${signedChallenge.proof.publicKey}")`

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
            ownerKeys.includes(formattedPublicKey),
          ownerKeysSet: ownerKeys.length > 0,
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
