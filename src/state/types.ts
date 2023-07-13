import {
  Account,
  NumberOfValues,
  Persona,
  PersonaDataRequestItem,
  PersonaDataRequestResponseItem,
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

export type WalletData = z.infer<typeof WalletData>
export const WalletData = object({
  accounts: array(Account),
  personaData: PersonaDataRequestResponseItem,
  persona: Persona,
  proofs: array(SignedChallenge),
}).partial()

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
