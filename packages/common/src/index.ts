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
} as const

export type RadixButtonTheme = keyof typeof RadixButtonTheme

export const RadixButtonMode = {
  light: 'light',
  dark: 'dark',
} as const

export type RadixButtonMode = keyof typeof RadixButtonMode

export type PersonaData = { field: string; value: string }

export const RequestStatus = {
  pending: 'pending',
  success: 'success',
  fail: 'fail',
  cancelled: 'cancelled',
  ignored: 'ignored',
} as const

export const RequestItemType = {
  loginRequest: 'loginRequest',
  dataRequest: 'dataRequest',
  sendTransaction: 'sendTransaction',
  proofRequest: 'proofRequest',
} as const

export type RequestItemType = typeof RequestItemType

export type RequestItemTypes = keyof typeof RequestItemType

export type RequestStatusTypes = keyof typeof RequestStatus

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
