import {
  Account,
  NumberOfValues,
  Persona,
  PersonaDataName,
  PersonaDataRequestItem,
  Proof,
} from '@radixdlt/wallet-sdk'
import { array, discriminatedUnion, literal, object, string, z } from 'zod'

export const proofType = {
  persona: 'persona',
  account: 'account',
} as const

export type SignedChallengePersona = z.infer<typeof SignedChallengePersona>
export const SignedChallengePersona = object({
  challenge: string(),
  proof: Proof,
  address: string(),
  type: literal(proofType.persona),
})

export type SignedChallengeAccount = z.infer<typeof SignedChallengeAccount>
export const SignedChallengeAccount = object({
  challenge: string(),
  proof: Proof,
  address: string(),
  type: literal(proofType.account),
})

export type SignedChallenge = z.infer<typeof SignedChallenge>
export const SignedChallenge = discriminatedUnion('type', [
  SignedChallengePersona,
  SignedChallengeAccount,
])

export const WalletDataPersonaDataFullName = object({
  entry: literal('fullName'),
  fields: PersonaDataName,
})

export const WalletDataPersonaDataEmailAddresses = object({
  entry: literal('emailAddresses'),
  fields: array(string()),
})

export const WalletDataPersonaDataPhoneNumbersAddresses = object({
  entry: literal('phoneNumbers'),
  fields: array(string()),
})

export type WalletDataPersonaData = z.infer<typeof WalletDataPersonaData>
export const WalletDataPersonaData = discriminatedUnion('entry', [
  WalletDataPersonaDataFullName,
  WalletDataPersonaDataEmailAddresses,
  WalletDataPersonaDataPhoneNumbersAddresses,
])

export type WalletData = z.infer<typeof WalletData>
export const WalletData = object({
  accounts: array(Account),
  personaData: array(WalletDataPersonaData),
  persona: Persona.optional(),
  proofs: array(SignedChallenge),
})

export type SharedData = z.infer<typeof SharedData>
export const SharedData = object({
  ongoingAccounts: NumberOfValues.optional(),
  ongoingPersonaData: PersonaDataRequestItem.optional(),
})

export type RdtState = z.infer<typeof RdtState>
export const RdtState = object({
  walletData: WalletData,
  sharedData: SharedData,
})

export const walletDataDefault: WalletData = {
  accounts: [],
  personaData: [],
  proofs: [],
  persona: undefined,
}
