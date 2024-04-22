import type {
  Account,
  PersonaDataRequestResponseItem,
  WalletAuthorizedRequestResponseItems,
  WalletUnauthorizedRequestResponseItems,
} from '../../../schemas'
import { produce } from 'immer'
import type { ResultAsync } from 'neverthrow'
import { okAsync } from 'neverthrow'
import { SignedChallengeAccount, WalletData, proofType } from '../../../state'

export type WalletDataRequestResponse =
  | WalletAuthorizedRequestResponseItems
  | WalletUnauthorizedRequestResponseItems

const withAccounts =
  (input: WalletDataRequestResponse) =>
  (walletData: WalletData): WalletData => {
    let accounts: Account[] = []
    if (input.discriminator === 'authorizedRequest') {
      const oneTimeAccounts = input.oneTimeAccounts?.accounts ?? []
      const ongoingAccounts = input.ongoingAccounts?.accounts ?? []
      accounts = [...oneTimeAccounts, ...ongoingAccounts]
    } else if (input.discriminator === 'unauthorizedRequest') {
      const oneTimeAccounts = input.oneTimeAccounts?.accounts ?? []

      accounts = oneTimeAccounts
    }

    return produce(walletData, (draft) => {
      draft.accounts = accounts
    })
  }

const withPersonaDataEntries = (
  input: PersonaDataRequestResponseItem,
): WalletData['personaData'] => {
  const entries: WalletData['personaData'] = []

  if (input.name) {
    entries.push({
      entry: 'fullName',
      fields: input.name,
    })
  }

  if (input.emailAddresses)
    entries.push({
      entry: 'emailAddresses',
      fields: input.emailAddresses,
    })

  if (input.phoneNumbers)
    entries.push({
      entry: 'phoneNumbers',
      fields: input.phoneNumbers,
    })

  return entries
}

const withPersonaData =
  (input: WalletDataRequestResponse) => (walletData: WalletData) =>
    produce(walletData, (draft) => {
      if (input.discriminator === 'authorizedRequest') {
        if (input.oneTimePersonaData)
          draft.personaData = withPersonaDataEntries(input.oneTimePersonaData)
        if (input.ongoingPersonaData)
          draft.personaData = withPersonaDataEntries(input.ongoingPersonaData)
      } else if (
        input.discriminator === 'unauthorizedRequest' &&
        input.oneTimePersonaData
      )
        draft.personaData = withPersonaDataEntries(input.oneTimePersonaData)
    })

const withPersona =
  (input: WalletDataRequestResponse) => (walletData: WalletData) =>
    produce(walletData, (draft) => {
      if (input.discriminator === 'authorizedRequest')
        draft.persona = input.auth?.persona
    })

const withProofs =
  (input: WalletDataRequestResponse) => (walletData: WalletData) =>
    produce(walletData, (draft) => {
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
            }),
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
            }),
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
            }),
          )
          draft.proofs.push(...accountProofs)
        }
      }
    })

export const transformWalletResponseToRdtWalletData = (
  response: WalletDataRequestResponse,
): ResultAsync<WalletData, never> =>
  okAsync({
    accounts: [],
    personaData: [],
    proofs: [],
    persona: undefined,
  })
    .map(withAccounts(response))
    .map(withPersonaData(response))
    .map(withPersona(response))
    .map(withProofs(response))
