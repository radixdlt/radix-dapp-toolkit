import {
  WalletAuthorizedRequestResponseItems,
  WalletUnauthorizedRequestResponseItems,
} from '@radixdlt/wallet-sdk'
import { Result, ok } from 'neverthrow'
import {
  RdtAccountProof,
  RdtProof,
  RdtStateWalletData,
  proofType,
  rdtStateDefault,
} from '../schemas'
import { WalletClient } from '../../wallet/wallet-client'

export type TransformWalletResponseToRdtDataInput =
  | WalletAuthorizedRequestResponseItems
  | WalletUnauthorizedRequestResponseItems

const withAccounts =
  (input: TransformWalletResponseToRdtDataInput) =>
  (walletData: RdtStateWalletData) => {
    const updated = { ...walletData }

    if (input.discriminator === 'authorizedRequest') {
      updated.accounts = [
        ...(input.oneTimeAccounts?.accounts ?? []),
        ...(input.ongoingAccounts?.accounts ?? []),
      ]
    } else if (input.discriminator === 'unauthorizedRequest')
      updated.accounts = [...(input.oneTimeAccounts?.accounts ?? [])]

    return ok(updated)
  }

const withPersonaData =
  (input: TransformWalletResponseToRdtDataInput) =>
  (walletData: RdtStateWalletData) => {
    const updated = { ...walletData }

    if (input.discriminator === 'authorizedRequest') {
      updated.personaData = [
        ...(input.oneTimePersonaData?.fields ?? []),
        ...(input.ongoingPersonaData?.fields ?? []),
      ]
    } else if (input.discriminator === 'unauthorizedRequest')
      updated.personaData = [...(input.oneTimePersonaData?.fields ?? [])]

    return ok(updated)
  }

const withPersona =
  (input: TransformWalletResponseToRdtDataInput) =>
  (walletData: RdtStateWalletData) => {
    const updated = { ...walletData }

    if (input.discriminator === 'authorizedRequest')
      updated.persona = input.auth?.persona

    return ok(updated)
  }

export const transformWalletResponseToRdtWalletData = (
  input: TransformWalletResponseToRdtDataInput
): Result<RdtStateWalletData, never> =>
  ok(rdtStateDefault['walletData'])
    .andThen(withAccounts(input))
    .andThen(withPersonaData(input))
    .andThen(withPersona(input))

type WalletDataResponse = ReturnType<
  Awaited<ReturnType<WalletClient['request']>>['_unsafeUnwrap']
>

export const withProofs = (walletDataResponse: WalletDataResponse) => {
  let proofs: RdtProof[] = []

  if (walletDataResponse.discriminator === 'authorizedRequest') {
    if (walletDataResponse.auth.discriminator === 'loginWithChallenge')
      proofs.push({
        challenge: walletDataResponse.auth.challenge,
        proof: walletDataResponse.auth.proof,
        identityAddress: walletDataResponse.auth.persona.identityAddress,
        type: proofType.persona,
      })

    if (
      walletDataResponse.ongoingAccounts?.challenge &&
      walletDataResponse.ongoingAccounts.proofs?.length
    ) {
      const challenge = walletDataResponse.ongoingAccounts.challenge!
      const accountProof = walletDataResponse.ongoingAccounts.proofs.map(
        (item) => ({
          ...item,
          challenge,
          type: proofType.account,
        })
      )

      proofs = [...proofs, ...accountProof]
    }

    if (
      walletDataResponse.oneTimeAccounts?.challenge &&
      walletDataResponse.oneTimeAccounts.proofs?.length
    ) {
      const challenge = walletDataResponse.oneTimeAccounts.challenge!
      const accountProofs = walletDataResponse.oneTimeAccounts.proofs.map(
        (item): RdtAccountProof => ({
          ...item,
          challenge,
          type: proofType.account,
        })
      )
      proofs = [...proofs, ...accountProofs]
    }
  }
  return proofs
}
