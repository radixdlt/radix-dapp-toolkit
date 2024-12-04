export type Account = { label: string; address: string; appearanceId: number }

export const RadixButtonStatus = {
  pending: 'pending',
  success: 'success',
  error: 'error',
  default: 'default',
} as const

export type RadixButtonStatus = keyof typeof RadixButtonStatus

export const RadixButtonTheme = {
  'radix-blue': 'radix-blue',
  black: 'black',
  'white-with-outline': 'white-with-outline',
  white: 'white',
  custom: 'custom',
} as const

export type RadixButtonTheme = keyof typeof RadixButtonTheme

export const RadixButtonMode = {
  light: 'light',
  dark: 'dark',
} as const

export type RadixButtonMode = keyof typeof RadixButtonMode

export type PersonaData = { field: string; value: string }

export const RequestStatus = {
  fail: 'fail',
  ignored: 'ignored',
  pending: 'pending',
  success: 'success',
  timedOut: 'timedOut',
  cancelled: 'cancelled',
  /**
   * Pending commit status is for preauthorization which was signed but not yet successfully committed to the network
   */
  pendingCommit: 'pendingCommit',
} as const

export const RequestItemType = {
  dataRequest: 'dataRequest',
  proofRequest: 'proofRequest',
  loginRequest: 'loginRequest',
  sendTransaction: 'sendTransaction',
  preAuthorizationRequest: 'preAuthorizationRequest',
} as const

export type RequestItemType = typeof RequestItemType

export type RequestItemTypes = keyof typeof RequestItemType

export type RequestStatusTypes = keyof typeof RequestStatus

/**
 * Not used in the codebase. Will be removed in the next major release future.
 * @deprecated
 */
export type WalletRequest<
  RequestType extends RequestItemTypes,
  Status extends RequestStatusTypes,
  T = {},
> = {
  type: RequestType
  status: Status
  id: string
  timestamp: number
  showCancel?: boolean
  transactionIntentHash?: string
  transactionStatus?: string
  walletInteraction: any
  walletResponse?: any
  metadata: Record<string, string | number | boolean>
} & T

export type RequestItem = {
  type: RequestItemTypes
  status: RequestStatusTypes
  interactionId: string
  createdAt: number
  showCancel?: boolean
  transactionIntentHash?: string
  error?: string
  walletInteraction?: any
  walletResponse?: any
  sentToWallet?: boolean
  isOneTimeRequest?: boolean
  metadata?: Record<string, string | number | boolean>
  walletData?: any
}

