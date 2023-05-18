import {
  Account,
  NumberOfAccounts,
  Persona,
  PersonaData,
  PersonaDataField,
  Proof,
} from '@radixdlt/wallet-sdk'
import {
  array,
  boolean,
  discriminatedUnion,
  literal,
  object,
  string,
  z,
} from 'zod'

const DataRequestAccounts = NumberOfAccounts.merge(
  object({
    challenge: string().optional(),
    reset: boolean().optional().default(false),
    oneTime: boolean().optional().default(false),
  })
)

const DataRequestPersonaData = object({
  fields: array(PersonaDataField),
  oneTime: boolean().optional().default(false),
  reset: boolean().optional().default(false),
})

export type ConnectButtonDataRequestInput = z.infer<
  typeof ConnectButtonDataRequestInput
>
export const ConnectButtonDataRequestInput = object({
  challenge: string().optional(),
  accounts: DataRequestAccounts.omit({ reset: true, oneTime: true }).optional(),
  personaData: DataRequestPersonaData.omit({
    oneTime: true,
    reset: true,
  }).optional(),
})

export type DataRequestInput = z.infer<typeof DataRequestInput>
export const DataRequestInput = object({
  challenge: string().optional(),
  accounts: DataRequestAccounts.optional(),
  personaData: DataRequestPersonaData.optional(),
})

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

export type RdtStateWalletData = z.infer<typeof RdtStateWalletData>
export const RdtStateWalletData = object({
  accounts: array(Account).default([]),
  personaData: array(PersonaData).default([]),
  persona: Persona.optional(),
})

export type RdtState = z.infer<typeof RdtState>
export const RdtState = object({
  connected: boolean(),
  walletData: RdtStateWalletData,
  sharedData: object({
    ongoingAccounts: DataRequestAccounts.omit({
      challenge: true,
      oneTime: true,
      reset: true,
    }).optional(),
    ongoingPersonaData: DataRequestPersonaData.omit({
      oneTime: true,
      reset: true,
    }).optional(),
  }).optional(),
})

export const rdtStateDefault = {
  connected: false,
  walletData: {
    accounts: [],
    personaData: [],
  },
  sharedData: {},
} satisfies RdtState

export type DataRequestOutput = z.infer<typeof DataRequestOutput>
export const DataRequestOutput = RdtStateWalletData.and(
  object({
    signedChallenges: SignedChallenge.array(),
  })
)
