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
  merge,
  Output,
  ValiError,
  custom,
} from 'valibot'

/**
 * Wallet schemas
 */

export type Account = Output<typeof Account>
export const Account = object({
  address: string(),
  label: string(),
  appearanceId: number(),
})

export type Proof = Output<typeof Proof>
export const Proof = object({
  publicKey: string(),
  signature: string(),
  curve: union([literal('curve25519'), literal('secp256k1')]),
})

export type AccountProof = Output<typeof AccountProof>
export const AccountProof = object({
  accountAddress: string(),
  proof: Proof,
})

export type Persona = Output<typeof Persona>
export const Persona = object({ identityAddress: string(), label: string() })

export const personaDataFullNameVariant = {
  western: 'western',
  eastern: 'eastern',
} as const
export type PersonaDataNameVariant = Output<typeof PersonaDataNameVariant>
export const PersonaDataNameVariant = union([
  literal(personaDataFullNameVariant.eastern),
  literal(personaDataFullNameVariant.western),
])

export type PersonaDataName = Output<typeof PersonaDataName>
export const PersonaDataName = object({
  variant: PersonaDataNameVariant,
  familyName: string(),
  nickname: string(),
  givenNames: string(),
})

export type NumberOfValues = Output<typeof NumberOfValues>
export const NumberOfValues = object({
  quantifier: union([literal('exactly'), literal('atLeast')]),
  quantity: number([minValue(0, 'The number must be at least 0.')]),
})

export type AccountsRequestItem = Output<typeof AccountsRequestItem>
export const AccountsRequestItem = object({
  challenge: optional(string()),
  numberOfAccounts: NumberOfValues,
})

export type AccountsRequestResponseItem = Output<
  typeof AccountsRequestResponseItem
>
export const AccountsRequestResponseItem = object(
  {
    accounts: array(Account),
    challenge: optional(string()),
    proofs: optional(array(AccountProof)),
  },
  [
    custom((data) => {
      if (data.challenge || data?.proofs) {
        return !!(data.challenge && data?.proofs?.length)
      }
      return true
    }, 'missing challenge or proofs'),
  ],
)

export type PersonaDataRequestItem = Output<typeof PersonaDataRequestItem>
export const PersonaDataRequestItem = object({
  isRequestingName: optional(boolean()),
  numberOfRequestedEmailAddresses: optional(NumberOfValues),
  numberOfRequestedPhoneNumbers: optional(NumberOfValues),
})

export type PersonaDataRequestResponseItem = Output<
  typeof PersonaDataRequestResponseItem
>
export const PersonaDataRequestResponseItem = object({
  name: optional(PersonaDataName),
  emailAddresses: optional(array(string())),
  phoneNumbers: optional(array(string())),
})

export type ResetRequestItem = Output<typeof ResetRequestItem>
export const ResetRequestItem = object({
  accounts: boolean(),
  personaData: boolean(),
})

export type LoginRequestResponseItem = Output<typeof LoginRequestResponseItem>
export const LoginRequestResponseItem = object(
  {
    persona: Persona,
    challenge: optional(string()),
    proof: optional(Proof),
  },
  [
    custom((data) => {
      if (data.challenge || data.proof) {
        return !!(data.challenge && data.proof)
      }
      return true
    }, 'missing challenge or proof'),
  ],
)

export type WalletUnauthorizedRequestItems = Output<
  typeof WalletUnauthorizedRequestItems
>
export const WalletUnauthorizedRequestItems = object({
  discriminator: literal('unauthorizedRequest'),
  oneTimeAccounts: optional(AccountsRequestItem),
  oneTimePersonaData: optional(PersonaDataRequestItem),
})

export type AuthUsePersonaRequestItem = Output<typeof AuthUsePersonaRequestItem>
export const AuthUsePersonaRequestItem = object({
  discriminator: literal('usePersona'),
  identityAddress: string(),
})

export type AuthLoginWithoutChallengeRequestItem = Output<
  typeof AuthLoginWithoutChallengeRequestItem
>
export const AuthLoginWithoutChallengeRequestItem = object({
  discriminator: literal('loginWithoutChallenge'),
})

export type AuthLoginWithChallengeRequestItem = Output<
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

export type WalletAuthorizedRequestItems = Output<
  typeof WalletAuthorizedRequestItems
>
export const WalletAuthorizedRequestItems = object({
  discriminator: literal('authorizedRequest'),
  auth: AuthRequestItem,
  reset: optional(ResetRequestItem),
  oneTimeAccounts: optional(AccountsRequestItem),
  ongoingAccounts: optional(AccountsRequestItem),
  oneTimePersonaData: optional(PersonaDataRequestItem),
  ongoingPersonaData: optional(PersonaDataRequestItem),
})

export type WalletRequestItems = Output<typeof WalletRequestItems>
export const WalletRequestItems = union([
  WalletUnauthorizedRequestItems,
  WalletAuthorizedRequestItems,
])

export type SendTransactionItem = Output<typeof SendTransactionItem>
export const SendTransactionItem = object({
  transactionManifest: string(),
  version: number(),
  blobs: optional(array(string())),
  message: optional(string()),
})

export type WalletTransactionItems = Output<typeof WalletTransactionItems>
export const WalletTransactionItems = object({
  discriminator: literal('transaction'),
  send: SendTransactionItem,
})

export type SendTransactionResponseItem = Output<
  typeof SendTransactionResponseItem
>
export const SendTransactionResponseItem = object({
  transactionIntentHash: string(),
})

export type WalletTransactionResponseItems = Output<
  typeof WalletTransactionResponseItems
>
const WalletTransactionResponseItems = object({
  discriminator: literal('transaction'),
  send: SendTransactionResponseItem,
})

export type CancelRequest = Output<typeof CancelRequest>
export const CancelRequest = object({
  discriminator: literal('cancelRequest'),
})

export type WalletInteractionItems = Output<typeof WalletInteractionItems>
export const WalletInteractionItems = union([
  WalletRequestItems,
  WalletTransactionItems,
  CancelRequest,
])

export type Metadata = Output<typeof Metadata>
export const Metadata = object({
  version: literal(2),
  networkId: number(),
  dAppDefinitionAddress: string(),
  origin: string(),
})

export type MetadataWithOrigin = Output<typeof MetadataWithOrigin>
export const MetadataWithOrigin = merge([
  Metadata,
  object({ origin: string() }),
])

export type WalletInteraction = Output<typeof WalletInteraction>
export const WalletInteraction = object({
  interactionId: string(),
  metadata: Metadata,
  items: WalletInteractionItems,
})

export type WalletInteractionWithOrigin = Output<
  typeof WalletInteractionWithOrigin
>

export const WalletInteractionWithOrigin = merge([
  WalletInteraction,
  object({ metadata: MetadataWithOrigin }),
])

export type WalletUnauthorizedRequestResponseItems = Output<
  typeof WalletUnauthorizedRequestResponseItems
>
const WalletUnauthorizedRequestResponseItems = object({
  discriminator: literal('unauthorizedRequest'),
  oneTimeAccounts: optional(AccountsRequestResponseItem),
  oneTimePersonaData: optional(PersonaDataRequestResponseItem),
})

export type AuthLoginWithoutChallengeRequestResponseItem = Output<
  typeof AuthLoginWithoutChallengeRequestResponseItem
>
export const AuthLoginWithoutChallengeRequestResponseItem = object({
  discriminator: literal('loginWithoutChallenge'),
  persona: Persona,
})

export type AuthLoginWithChallengeRequestResponseItem = Output<
  typeof AuthLoginWithChallengeRequestResponseItem
>
export const AuthLoginWithChallengeRequestResponseItem = object({
  discriminator: literal('loginWithChallenge'),
  persona: Persona,
  challenge: string(),
  proof: Proof,
})

export const AuthLoginRequestResponseItem = union([
  AuthLoginWithoutChallengeRequestResponseItem,
  AuthLoginWithChallengeRequestResponseItem,
])

export type AuthUsePersonaRequestResponseItem = Output<
  typeof AuthUsePersonaRequestResponseItem
>
const AuthUsePersonaRequestResponseItem = object({
  discriminator: literal('usePersona'),
  persona: Persona,
})

export type AuthRequestResponseItem = Output<typeof AuthRequestResponseItem>
export const AuthRequestResponseItem = union([
  AuthUsePersonaRequestResponseItem,
  AuthLoginRequestResponseItem,
])

export type WalletAuthorizedRequestResponseItems = Output<
  typeof WalletAuthorizedRequestResponseItems
>
export const WalletAuthorizedRequestResponseItems = object({
  discriminator: literal('authorizedRequest'),
  auth: AuthRequestResponseItem,
  oneTimeAccounts: optional(AccountsRequestResponseItem),
  ongoingAccounts: optional(AccountsRequestResponseItem),
  oneTimePersonaData: optional(PersonaDataRequestResponseItem),
  ongoingPersonaData: optional(PersonaDataRequestResponseItem),
})

export type WalletRequestResponseItems = Output<
  typeof WalletRequestResponseItems
>
export const WalletRequestResponseItems = union([
  WalletUnauthorizedRequestResponseItems,
  WalletAuthorizedRequestResponseItems,
])

export type WalletInteractionResponseItems = Output<
  typeof WalletInteractionResponseItems
>
const WalletInteractionResponseItems = union([
  WalletRequestResponseItems,
  WalletTransactionResponseItems,
])

export type WalletInteractionSuccessResponse = Output<
  typeof WalletInteractionSuccessResponse
>
export const WalletInteractionSuccessResponse = object({
  discriminator: literal('success'),
  interactionId: string(),
  items: WalletInteractionResponseItems,
})

export type WalletInteractionFailureResponse = Output<
  typeof WalletInteractionFailureResponse
>
export const WalletInteractionFailureResponse = object({
  discriminator: literal('failure'),
  interactionId: string(),
  error: string(),
  message: optional(string()),
})

export type WalletInteractionResponse = Output<typeof WalletInteractionResponse>
export const WalletInteractionResponse = union([
  WalletInteractionSuccessResponse,
  WalletInteractionFailureResponse,
])

export const extensionInteractionDiscriminator = {
  extensionStatus: 'extensionStatus',
  openPopup: 'openPopup',
} as const

export const StatusExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal(extensionInteractionDiscriminator.extensionStatus),
})

export type StatusExtensionInteraction = Output<
  typeof StatusExtensionInteraction
>

export const OpenPopupExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal(extensionInteractionDiscriminator.openPopup),
})

export type OpenPopupExtensionInteraction = Output<
  typeof OpenPopupExtensionInteraction
>

export type WalletInteractionExtensionInteraction = Output<
  typeof WalletInteractionExtensionInteraction
>

export const WalletInteractionExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal('walletInteraction'),
  interaction: WalletInteraction,
  sessionId: optional(string()),
})

export type CancelInteractionExtensionInteraction = Output<
  typeof CancelInteractionExtensionInteraction
>

export const CancelInteractionExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal('cancelInteraction'),
  metadata: Metadata,
})

export const ExtensionInteraction = union([
  StatusExtensionInteraction,
  OpenPopupExtensionInteraction,
  WalletInteractionExtensionInteraction,
  CancelInteractionExtensionInteraction,
])

export type ExtensionInteraction = Output<typeof ExtensionInteraction>

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

export type MessageLifeCycleExtensionStatusEvent = Output<
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

export type MessageLifeCycleEvent = Output<typeof MessageLifeCycleEvent>

export type IncomingMessage = Output<typeof IncomingMessage>
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

export const AnswerIO = merge([
  SignalingServerMessage,
  object({
    method: Answer,
    payload: object({
      sdp: string(),
    }),
  }),
])

export const OfferIO = merge([
  SignalingServerMessage,
  object({
    method: Offer,
    payload: object({
      sdp: string(),
    }),
  }),
])

export const IceCandidatePayloadIO = object({
  candidate: string(),
  sdpMid: string(),
  sdpMLineIndex: number(),
})

export const IceCandidateIO = merge([
  SignalingServerMessage,
  object({
    method: IceCandidate,
    payload: IceCandidatePayloadIO,
  }),
])

export const IceCandidatesIO = merge([
  SignalingServerMessage,
  object({
    method: IceCandidates,
    payload: array(IceCandidatePayloadIO),
  }),
])

export type Answer = Output<typeof AnswerIO>
export type Offer = Output<typeof OfferIO>
export type IceCandidate = Output<typeof IceCandidateIO>
export type IceCandidates = Output<typeof IceCandidatesIO>
export type MessagePayloadTypes = Output<typeof Types>
export type MessageSources = Output<typeof Sources>

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
  error: ValiError
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
