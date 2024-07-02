import {
  Account,
  NumberOfValues,
  Persona,
  PersonaDataName,
  PersonaDataRequestItem,
  Proof,
} from '../../schemas'
import {
  array,
  boolean,
  optional,
  literal,
  object,
  variant,
  string,
  Output,
} from 'valibot'

export const proofType = {
  persona: 'persona',
  account: 'account',
} as const

export type SignedChallengePersona = Output<typeof SignedChallengePersona>
export const SignedChallengePersona = object({
  challenge: string(),
  proof: Proof,
  address: string(),
  type: literal(proofType.persona),
})

export type SignedChallengeAccount = Output<typeof SignedChallengeAccount>
export const SignedChallengeAccount = object({
  challenge: string(),
  proof: Proof,
  address: string(),
  type: literal(proofType.account),
})

export type SignedChallenge = Output<typeof SignedChallenge>
export const SignedChallenge = variant('type', [
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

export type WalletDataPersonaData = Output<typeof WalletDataPersonaData>
export const WalletDataPersonaData = variant('entry', [
  WalletDataPersonaDataFullName,
  WalletDataPersonaDataEmailAddresses,
  WalletDataPersonaDataPhoneNumbersAddresses,
])

export type WalletData = Output<typeof WalletData>
export const WalletData = object({
  accounts: array(Account),
  personaData: array(WalletDataPersonaData),
  persona: optional(Persona),
  proofs: array(SignedChallenge),
})

export type SharedData = Output<typeof SharedData>
export const SharedData = object({
  persona: optional(object({ proof: boolean() })),
  ongoingAccounts: optional(
    object({
      numberOfAccounts: optional(NumberOfValues),
      proof: boolean(),
    }),
  ),
  ongoingPersonaData: optional(PersonaDataRequestItem),
})

export type RdtState = Output<typeof RdtState>
export const RdtState = object({
  loggedInTimestamp: string(),
  walletData: WalletData,
  sharedData: SharedData,
})

export const walletDataDefault = {
  accounts: [],
  personaData: [],
  proofs: [],
  persona: undefined,
} satisfies WalletData
