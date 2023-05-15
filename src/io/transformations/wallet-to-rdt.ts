import {
  Proof,
  WalletAuthorizedRequestResponseItems,
  WalletUnauthorizedRequestResponseItems,
} from '@radixdlt/wallet-sdk'
import { Result, ok } from 'neverthrow'
import { RdtStateWalletData, rdtStateDefault } from '../schemas'
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

export const proofType = {
  persona: 'persona',
  account: 'account',
} as const

export type PersonaProof = {
  challenge: string
  proof: Proof
  identityAddress: string
  type: (typeof proofType)['persona']
}

export type AccountProof = {
  challenge: string
  proof: Proof
  accountAddress: string
  type: (typeof proofType)['account']
}

export type Proofs = PersonaProof | AccountProof

type WalletDataResponse = ReturnType<
  Awaited<ReturnType<WalletClient['request']>>['_unsafeUnwrap']
>

export const withProofs = (walletDataResponse: WalletDataResponse) => {
  let proofs: Proofs[] = []

  if (walletDataResponse.discriminator === 'authorizedRequest') {
    if (walletDataResponse.auth.discriminator === 'loginWithChallenge')
      proofs = [
        ...proofs,
        {
          challenge: walletDataResponse.auth.challenge,
          proof: walletDataResponse.auth.proof,
          identityAddress: walletDataResponse.auth.persona.identityAddress,
          type: proofType.persona,
        },
      ]

    if (
      walletDataResponse.ongoingAccounts?.challenge &&
      walletDataResponse.ongoingAccounts.proofs?.length
    ) {
      const challenge = walletDataResponse.ongoingAccounts.challenge!
      const accountProofs = walletDataResponse.ongoingAccounts.proofs.map(
        (item): AccountProof => ({
          ...item,
          challenge,
          type: proofType.account,
        })
      )
      proofs = [...proofs, ...accountProofs]
    }

    if (
      walletDataResponse.oneTimeAccounts?.challenge &&
      walletDataResponse.oneTimeAccounts.proofs?.length
    ) {
      const challenge = walletDataResponse.oneTimeAccounts.challenge!
      const accountProofs = walletDataResponse.oneTimeAccounts.proofs.map(
        (item): AccountProof => ({
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
