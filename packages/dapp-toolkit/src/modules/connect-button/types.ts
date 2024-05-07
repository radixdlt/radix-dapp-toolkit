export type ConnectButtonStatus =
  (typeof ConnectButtonStatus)[keyof typeof ConnectButtonStatus]
export const ConnectButtonStatus = {
  pending: 'pending',
  success: 'success',
  default: 'default',
  error: 'error',
} as const
