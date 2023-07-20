import {
  WalletAuthorizedRequestResponseItems,
  WalletUnauthorizedRequestResponseItems,
} from '@radixdlt/wallet-sdk'
import { produce } from 'immer'
import { Result, ok } from 'neverthrow'
import {
  SignedChallengeAccount,
  WalletData,
  proofType,
} from '../../state/types'

export type WalletDataRequestResponse =
  | WalletAuthorizedRequestResponseItems
  | WalletUnauthorizedRequestResponseItems

const withAccounts =
  (input: WalletDataRequestResponse) => (walletData: WalletData) =>
    produce(walletData, (draft) => {
      if (input.discriminator === 'authorizedRequest') {
        const oneTimeAccounts = input.oneTimeAccounts?.accounts ?? []
        const ongoingAccounts = input.ongoingAccounts?.accounts ?? []
        const accounts = [...oneTimeAccounts, ...ongoingAccounts]

        draft.accounts = accounts
      } else if (input.discriminator === 'unauthorizedRequest') {
        const oneTimeAccounts = input.oneTimeAccounts?.accounts ?? []

        draft.accounts = oneTimeAccounts
      }
    })

const withPersonaData =
  (input: WalletDataRequestResponse) => (walletData: WalletData) =>
    produce(walletData, (draft) => {
      if (input.discriminator === 'authorizedRequest') {
        if (input.oneTimePersonaData)
          draft.personaData = input.oneTimePersonaData
        if (input.ongoingPersonaData)
          draft.personaData = input.ongoingPersonaData
      } else if (input.discriminator === 'unauthorizedRequest')
        draft.personaData = input.oneTimePersonaData
    })

const withPersona =
  (input: WalletDataRequestResponse) => (walletData: WalletData) =>
    produce(walletData, (draft) => {
      if (input.discriminator === 'authorizedRequest')
        draft.persona = input.auth?.persona
    })

const withProofs =
  (input: WalletDataRequestResponse) => (walletData: WalletData) => {
    return produce(walletData, (draft) => {
      draft.proofs = []
      if (input.discriminator === 'authorizedRequest') {
        if (input.auth.discriminator === 'loginWithChallenge')
          draft.proofs.push({
            challenge: input.auth.challenge,
            proof: input.auth.proof,
            address: input.auth.persona.identityAddress,
            type: proofType.persona,
          })

        if (
          input.ongoingAccounts?.challenge &&
          input.ongoingAccounts.proofs?.length
        ) {
          const challenge = input.ongoingAccounts.challenge!
          const accountProofs = input.ongoingAccounts.proofs.map(
            ({ accountAddress, proof }) => ({
              proof,
              address: accountAddress,
              challenge,
              type: proofType.account,
            })
          )

          draft.proofs.push(...accountProofs)
        }

        if (
          input.oneTimeAccounts?.challenge &&
          input.oneTimeAccounts.proofs?.length
        ) {
          const challenge = input.oneTimeAccounts.challenge!
          const accountProofs = input.oneTimeAccounts.proofs.map(
            ({ accountAddress, proof }): SignedChallengeAccount => ({
              proof,
              address: accountAddress,
              challenge,
              type: proofType.account,
            })
          )
          draft.proofs.push(...accountProofs)
        }
      }
      if (input.discriminator === 'unauthorizedRequest') {
        if (
          input.oneTimeAccounts?.challenge &&
          input.oneTimeAccounts.proofs?.length
        ) {
          const challenge = input.oneTimeAccounts.challenge!
          const accountProofs = input.oneTimeAccounts.proofs.map(
            ({ accountAddress, proof }): SignedChallengeAccount => ({
              proof,
              address: accountAddress,
              challenge,
              type: proofType.account,
            })
          )
          draft.proofs.push(...accountProofs)
        }
      }
    })
  }

export const transformWalletResponseToRdtWalletData = (
  response: WalletDataRequestResponse
): Result<WalletData, never> =>
  ok({})
    .map(withAccounts(response))
    .map(withPersonaData(response))
    .map(withPersona(response))
    .map(withProofs(response))
