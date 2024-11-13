import type { ResultAsync } from 'neverthrow'
import {
  array,
  boolean,
  literal,
  number,
  object,
  optional,
  minValue,
  string,
  union,
  InferOutput,
  ValiError,
  check,
  pipe,
} from 'valibot'

/**
 * Wallet schemas
 */

export type Account = InferOutput<typeof Account>
export const Account = object({
  address: string(),
  label: string(),
  appearanceId: number(),
})

export type Proof = InferOutput<typeof Proof>
export const Proof = object({
  publicKey: string(),
  signature: string(),
  curve: union([literal('curve25519'), literal('secp256k1')]),
})

export type AccountProof = InferOutput<typeof AccountProof>
export const AccountProof = object({
  accountAddress: string(),
  proof: Proof,
})

export type PersonaProof = InferOutput<typeof PersonaProof>
export const PersonaProof = object({
  identityAddress: string(),
  proof: Proof,
})

export type ProofOfOwnershipRequestItem = InferOutput<
  typeof ProofOfOwnershipRequestItem
>
export const ProofOfOwnershipRequestItem = object({
  challenge: string(),
  identityAddress: optional(string()),
  accountAddresses: optional(array(string())),
})

export const ProofOfOwnershipResponseItem = object({
  challenge: string(),
  proofs: array(union([AccountProof, PersonaProof])),
})

export type Persona = InferOutput<typeof Persona>
export const Persona = object({ identityAddress: string(), label: string() })

export const personaDataFullNameVariant = {
  western: 'western',
  eastern: 'eastern',
} as const
export type PersonaDataNameVariant = InferOutput<typeof PersonaDataNameVariant>
export const PersonaDataNameVariant = union([
  literal(personaDataFullNameVariant.eastern),
  literal(personaDataFullNameVariant.western),
])

export type PersonaDataName = InferOutput<typeof PersonaDataName>
export const PersonaDataName = object({
  variant: PersonaDataNameVariant,
  familyName: string(),
  nickname: string(),
  givenNames: string(),
})

export type NumberOfValues = InferOutput<typeof NumberOfValues>
export const NumberOfValues = object({
  quantifier: union([literal('exactly'), literal('atLeast')]),
  quantity: pipe(number(), minValue(0, 'The number must be at least 0.')),
})

export type AccountsRequestItem = InferOutput<typeof AccountsRequestItem>
export const AccountsRequestItem = object({
  challenge: optional(string()),
  numberOfAccounts: NumberOfValues,
})

export type AccountsRequestResponseItem = InferOutput<
  typeof AccountsRequestResponseItem
>
export const AccountsRequestResponseItem = pipe(
  object({
    accounts: array(Account),
    challenge: optional(string()),
    proofs: optional(array(AccountProof)),
  }),
  check((data) => {
    if (data.challenge || data?.proofs) {
      return !!(data.challenge && data?.proofs?.length)
    }
    return true
  }, 'missing challenge or proofs'),
)

export type PersonaDataRequestItem = InferOutput<typeof PersonaDataRequestItem>
export const PersonaDataRequestItem = object({
  isRequestingName: optional(boolean()),
  numberOfRequestedEmailAddresses: optional(NumberOfValues),
  numberOfRequestedPhoneNumbers: optional(NumberOfValues),
})

export type PersonaDataRequestResponseItem = InferOutput<
  typeof PersonaDataRequestResponseItem
>
export const PersonaDataRequestResponseItem = object({
  name: optional(PersonaDataName),
  emailAddresses: optional(array(string())),
  phoneNumbers: optional(array(string())),
})

export type ResetRequestItem = InferOutput<typeof ResetRequestItem>
export const ResetRequestItem = object({
  accounts: boolean(),
  personaData: boolean(),
})

export type LoginRequestResponseItem = InferOutput<
  typeof LoginRequestResponseItem
>
export const LoginRequestResponseItem = pipe(
  object({
    persona: Persona,
    challenge: optional(string()),
    proof: optional(Proof),
  }),
  check((data) => {
    if (data.challenge || data.proof) {
      return !!(data.challenge && data.proof)
    }
    return true
  }, 'missing challenge or proof'),
)

export type WalletUnauthorizedRequestItems = InferOutput<
  typeof WalletUnauthorizedRequestItems
>
export const WalletUnauthorizedRequestItems = object({
  discriminator: literal('unauthorizedRequest'),
  oneTimeAccounts: optional(AccountsRequestItem),
  oneTimePersonaData: optional(PersonaDataRequestItem),
})

export type AuthUsePersonaRequestItem = InferOutput<
  typeof AuthUsePersonaRequestItem
>
export const AuthUsePersonaRequestItem = object({
  discriminator: literal('usePersona'),
  identityAddress: string(),
})

export type AuthLoginWithoutChallengeRequestItem = InferOutput<
  typeof AuthLoginWithoutChallengeRequestItem
>
export const AuthLoginWithoutChallengeRequestItem = object({
  discriminator: literal('loginWithoutChallenge'),
})

export type AuthLoginWithChallengeRequestItem = InferOutput<
  typeof AuthLoginWithChallengeRequestItem
>
export const AuthLoginWithChallengeRequestItem = object({
  discriminator: literal('loginWithChallenge'),
  challenge: string(),
})

export const AuthLoginRequestItem = union([
  AuthLoginWithoutChallengeRequestItem,
  AuthLoginWithChallengeRequestItem,
])
export const AuthRequestItem = union([
  AuthUsePersonaRequestItem,
  AuthLoginRequestItem,
])

export type WalletAuthorizedRequestItems = InferOutput<
  typeof WalletAuthorizedRequestItems
>
export const WalletAuthorizedRequestItems = object({
  discriminator: literal('authorizedRequest'),
  auth: AuthRequestItem,
  reset: optional(ResetRequestItem),
  proofOfOwnership: optional(ProofOfOwnershipRequestItem),
  oneTimeAccounts: optional(AccountsRequestItem),
  ongoingAccounts: optional(AccountsRequestItem),
  oneTimePersonaData: optional(PersonaDataRequestItem),
  ongoingPersonaData: optional(PersonaDataRequestItem),
})

export type WalletRequestItems = InferOutput<typeof WalletRequestItems>
export const WalletRequestItems = union([
  WalletUnauthorizedRequestItems,
  WalletAuthorizedRequestItems,
])

export type SendTransactionItem = InferOutput<typeof SendTransactionItem>
export const SendTransactionItem = object({
  transactionManifest: string(),
  version: number(),
  blobs: optional(array(string())),
  message: optional(string()),
})

export type WalletTransactionItems = InferOutput<typeof WalletTransactionItems>
export const WalletTransactionItems = object({
  discriminator: literal('transaction'),
  send: SendTransactionItem,
})

export type SendTransactionResponseItem = InferOutput<
  typeof SendTransactionResponseItem
>
export const SendTransactionResponseItem = object({
  transactionIntentHash: string(),
})

export type WalletTransactionResponseItems = InferOutput<
  typeof WalletTransactionResponseItems
>
const WalletTransactionResponseItems = object({
  discriminator: literal('transaction'),
  send: SendTransactionResponseItem,
})

export type CancelRequest = InferOutput<typeof CancelRequest>
export const CancelRequest = object({
  discriminator: literal('cancelRequest'),
})

export type ExpireAtTime = InferOutput<typeof ExpireAtTime>
export const ExpireAtTime = object({
  discriminator: literal('expireAtTime'),
  unixTimestampSeconds: number(),
})

export type ExpireAfterDelay = InferOutput<typeof ExpireAfterDelay>
export const ExpireAfterDelay = object({
  discriminator: literal('expireAfterDelay'),
  expireAfterSeconds: number(),
})

export type SubintentRequestItem = InferOutput<typeof SubintentRequestItem>
export const SubintentRequestItem = object({
  discriminator: literal('subintent'),
  /**
   * Version of the message interface
   */
  version: number(),
  /**
   * Version of the Transaction Manifest
   */
  manifestVersion: number(),
  subintentManifest: string(),
  blobs: optional(array(string())),
  message: optional(string()),
  expiration: union([ExpireAtTime, ExpireAfterDelay]),
})

export type SubintentResponseItem = InferOutput<typeof SubintentResponseItem>
export const SubintentResponseItem = object({
  signedPartialTransaction: string(),
})

export type WalletPreAuthorizationItems = InferOutput<
  typeof WalletPreAuthorizationItems
>
export const WalletPreAuthorizationItems = object({
  discriminator: literal('preAuthorizationRequest'),
  request: optional(SubintentRequestItem),
})

export type WalletInteractionItems = InferOutput<typeof WalletInteractionItems>
export const WalletInteractionItems = union([
  WalletRequestItems,
  WalletTransactionItems,
  CancelRequest,
  WalletPreAuthorizationItems,
])

export type Metadata = InferOutput<typeof Metadata>
export const Metadata = object({
  version: literal(2),
  networkId: number(),
  dAppDefinitionAddress: string(),
  origin: string(),
})

export type WalletInteraction = InferOutput<typeof WalletInteraction>
export const WalletInteraction = object({
  interactionId: string(),
  metadata: Metadata,
  items: WalletInteractionItems,
})

export type WalletUnauthorizedRequestResponseItems = InferOutput<
  typeof WalletUnauthorizedRequestResponseItems
>
const WalletUnauthorizedRequestResponseItems = object({
  discriminator: literal('unauthorizedRequest'),
  oneTimeAccounts: optional(AccountsRequestResponseItem),
  oneTimePersonaData: optional(PersonaDataRequestResponseItem),
})

export type AuthLoginWithoutChallengeRequestResponseItem = InferOutput<
  typeof AuthLoginWithoutChallengeRequestResponseItem
>
export const AuthLoginWithoutChallengeRequestResponseItem = object({
  discriminator: literal('loginWithoutChallenge'),
  persona: Persona,
})

export type AuthLoginWithChallengeRequestResponseItem = InferOutput<
  typeof AuthLoginWithChallengeRequestResponseItem
>
export const AuthLoginWithChallengeRequestResponseItem = object({
  discriminator: literal('loginWithChallenge'),
  persona: Persona,
  challenge: string(),
  proof: Proof,
})

export type WalletPreAuthorizationResponseItems = InferOutput<
  typeof WalletPreAuthorizationResponseItems
>
export const WalletPreAuthorizationResponseItems = object({
  discriminator: literal('preAuthorizationResponse'),
  response: optional(SubintentResponseItem),
})

export const AuthLoginRequestResponseItem = union([
  AuthLoginWithoutChallengeRequestResponseItem,
  AuthLoginWithChallengeRequestResponseItem,
])

export type AuthUsePersonaRequestResponseItem = InferOutput<
  typeof AuthUsePersonaRequestResponseItem
>
const AuthUsePersonaRequestResponseItem = object({
  discriminator: literal('usePersona'),
  persona: Persona,
})

export type AuthRequestResponseItem = InferOutput<
  typeof AuthRequestResponseItem
>
export const AuthRequestResponseItem = union([
  AuthUsePersonaRequestResponseItem,
  AuthLoginRequestResponseItem,
])

export type WalletAuthorizedRequestResponseItems = InferOutput<
  typeof WalletAuthorizedRequestResponseItems
>
export const WalletAuthorizedRequestResponseItems = object({
  discriminator: literal('authorizedRequest'),
  auth: AuthRequestResponseItem,
  proofOfOwnership: optional(ProofOfOwnershipResponseItem),
  oneTimeAccounts: optional(AccountsRequestResponseItem),
  ongoingAccounts: optional(AccountsRequestResponseItem),
  oneTimePersonaData: optional(PersonaDataRequestResponseItem),
  ongoingPersonaData: optional(PersonaDataRequestResponseItem),
})

export type WalletRequestResponseItems = InferOutput<
  typeof WalletRequestResponseItems
>
export const WalletRequestResponseItems = union([
  WalletUnauthorizedRequestResponseItems,
  WalletAuthorizedRequestResponseItems,
])

export type WalletInteractionResponseItems = InferOutput<
  typeof WalletInteractionResponseItems
>
const WalletInteractionResponseItems = union([
  WalletRequestResponseItems,
  WalletTransactionResponseItems,
  WalletPreAuthorizationResponseItems,
])

export type WalletInteractionSuccessResponse = InferOutput<
  typeof WalletInteractionSuccessResponse
>
export const WalletInteractionSuccessResponse = object({
  discriminator: literal('success'),
  interactionId: string(),
  items: WalletInteractionResponseItems,
})

export type WalletInteractionFailureResponse = InferOutput<
  typeof WalletInteractionFailureResponse
>
export const WalletInteractionFailureResponse = object({
  discriminator: literal('failure'),
  interactionId: string(),
  error: string(),
  message: optional(string()),
})

export type WalletInteractionResponse = InferOutput<
  typeof WalletInteractionResponse
>
export const WalletInteractionResponse = union([
  WalletInteractionSuccessResponse,
  WalletInteractionFailureResponse,
])

export const extensionInteractionDiscriminator = {
  extensionStatus: 'extensionStatus',
  openPopup: 'openPopup',
  cancelWalletInteraction: 'cancelWalletInteraction',
  walletInteraction: 'walletInteraction',
} as const

export const StatusExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal(extensionInteractionDiscriminator.extensionStatus),
})

export type StatusExtensionInteraction = InferOutput<
  typeof StatusExtensionInteraction
>

export const OpenPopupExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal(extensionInteractionDiscriminator.openPopup),
})

export type OpenPopupExtensionInteraction = InferOutput<
  typeof OpenPopupExtensionInteraction
>

export type WalletInteractionExtensionInteraction = InferOutput<
  typeof WalletInteractionExtensionInteraction
>

export const WalletInteractionExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal(extensionInteractionDiscriminator.walletInteraction),
  interaction: WalletInteraction,
  sessionId: optional(string()),
})

export type CancelWalletInteractionExtensionInteraction = InferOutput<
  typeof CancelWalletInteractionExtensionInteraction
>

export const CancelWalletInteractionExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal(
    extensionInteractionDiscriminator.cancelWalletInteraction,
  ),
  metadata: Metadata,
})

export const ExtensionInteraction = union([
  StatusExtensionInteraction,
  OpenPopupExtensionInteraction,
  WalletInteractionExtensionInteraction,
  CancelWalletInteractionExtensionInteraction,
])

export type ExtensionInteraction = InferOutput<typeof ExtensionInteraction>

export const messageLifeCycleEventType = {
  extensionStatus: 'extensionStatus',
  receivedByExtension: 'receivedByExtension',
  receivedByWallet: 'receivedByWallet',
  requestCancelSuccess: 'requestCancelSuccess',
  requestCancelFail: 'requestCancelFail',
} as const

export const MessageLifeCycleExtensionStatusEvent = object({
  eventType: literal(messageLifeCycleEventType.extensionStatus),
  interactionId: string(),
  isWalletLinked: boolean(),
  isExtensionAvailable: boolean(),
  canHandleSessions: optional(boolean()),
})

export type MessageLifeCycleExtensionStatusEvent = InferOutput<
  typeof MessageLifeCycleExtensionStatusEvent
>

export const MessageLifeCycleEvent = object({
  eventType: union([
    literal(messageLifeCycleEventType.extensionStatus),
    literal(messageLifeCycleEventType.receivedByExtension),
    literal(messageLifeCycleEventType.receivedByWallet),
    literal(messageLifeCycleEventType.requestCancelSuccess),
    literal(messageLifeCycleEventType.requestCancelFail),
  ]),
  interactionId: string(),
})

export type MessageLifeCycleEvent = InferOutput<typeof MessageLifeCycleEvent>

export type IncomingMessage = InferOutput<typeof IncomingMessage>
const IncomingMessage = union([
  MessageLifeCycleEvent,
  WalletInteractionResponse,
])

export const eventType = {
  outgoingMessage: 'radix#chromeExtension#send',
  incomingMessage: 'radix#chromeExtension#receive',
} as const

export type CallbackFns = {
  eventCallback: (messageEvent: MessageLifeCycleEvent['eventType']) => void
  requestControl: (api: {
    cancelRequest: () => ResultAsync<
      'requestCancelSuccess',
      'requestCancelFail'
    >
    getRequest: () => WalletInteraction
  }) => void
}

/**
 * Signaling server schemas
 */

const Offer = literal('offer')
const Answer = literal('answer')
const IceCandidate = literal('iceCandidate')
const IceCandidates = literal('iceCandidates')

const Types = union([Offer, Answer, IceCandidate, IceCandidates])

export const Sources = union([literal('wallet'), literal('extension')])

export const SignalingServerMessage = object({
  requestId: string(),
  targetClientId: string(),
  encryptedPayload: string(),
  source: optional(Sources), // redundant, to be removed
  connectionId: optional(string()), // redundant, to be removed
})

export const AnswerIO = object({
  ...SignalingServerMessage.entries,
  method: Answer,
  payload: object({
    sdp: string(),
  }),
})

export const OfferIO = object({
  ...SignalingServerMessage.entries,
  method: Offer,
  payload: object({
    sdp: string(),
  }),
})

export const IceCandidatePayloadIO = object({
  candidate: string(),
  sdpMid: string(),
  sdpMLineIndex: number(),
})

export const IceCandidateIO = object({
  ...SignalingServerMessage.entries,
  method: IceCandidate,
  payload: IceCandidatePayloadIO,
})

export const IceCandidatesIO = object({
  ...SignalingServerMessage.entries,
  method: IceCandidates,
  payload: array(IceCandidatePayloadIO),
})

export type Answer = InferOutput<typeof AnswerIO>
export type Offer = InferOutput<typeof OfferIO>
export type IceCandidate = InferOutput<typeof IceCandidateIO>
export type IceCandidates = InferOutput<typeof IceCandidatesIO>
export type MessagePayloadTypes = InferOutput<typeof Types>
export type MessageSources = InferOutput<typeof Sources>

export type DataTypes = Answer | IceCandidate | Offer | IceCandidates

export type Confirmation = {
  info: 'confirmation'
  requestId: DataTypes['requestId']
}

export type RemoteData<T extends DataTypes = DataTypes> = {
  info: 'remoteData'
  remoteClientId: string
  requestId: T['requestId']
  data: T
}

export type RemoteClientDisconnected = {
  info: 'remoteClientDisconnected'
  remoteClientId: string
}

export type RemoteClientJustConnected = {
  info: 'remoteClientJustConnected'
  remoteClientId: string
}

export type RemoteClientIsAlreadyConnected = {
  info: 'remoteClientIsAlreadyConnected'
  remoteClientId: string
}

export type MissingRemoteClientError = {
  info: 'missingRemoteClientError'
  requestId: DataTypes['requestId']
}

export type InvalidMessageError = {
  info: 'invalidMessageError'
  error: string
  data: string
}

export type ValidationError = {
  info: 'validationError'
  requestId: DataTypes['requestId']
  error: ValiError<any>
}

export type SignalingServerResponse =
  | Confirmation
  | RemoteData
  | RemoteClientJustConnected
  | RemoteClientIsAlreadyConnected
  | RemoteClientDisconnected
  | MissingRemoteClientError
  | InvalidMessageError
  | ValidationError

export type SignalingServerErrorResponse =
  | RemoteClientDisconnected
  | MissingRemoteClientError
  | InvalidMessageError
  | ValidationError
