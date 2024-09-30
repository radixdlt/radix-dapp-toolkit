import {
  RadixButtonStatus,
  RadixButtonTheme,
  RequestItem,
  Account,
} from 'radix-connect-common'
import { Observable } from 'rxjs'

export type ConnectButtonStatus =
  (typeof ConnectButtonStatus)[keyof typeof ConnectButtonStatus]
export const ConnectButtonStatus = {
  pending: 'pending',
  success: 'success',
  default: 'default',
  error: 'error',
} as const

export type ConnectButtonModuleOutput = {
  status$: Observable<RadixButtonStatus>
  onConnect$: Observable<{ challenge: string } | undefined>
  onDisconnect$: Observable<void>
  onUpdateSharedAccounts$: Observable<void>
  onShowPopover$: Observable<void>
  onCancelRequestItem$: Observable<string>
  onLinkClick$: Observable<{
    type: 'account' | 'transaction' | 'showQrCode' | 'setupGuide' | 'getWallet'
    data: string
  }>
  setMode: (value: 'light' | 'dark') => void
  setTheme: (value: RadixButtonTheme) => void
  setActiveTab: (value: 'sharing' | 'requests') => void
  setIsMobile: (value: boolean) => void
  setIsWalletLinked: (value: boolean) => void
  setIsExtensionAvailable: (value: boolean) => void
  setConnected: (value: boolean) => void
  setLoggedInTimestamp: (value: string) => void
  setRequestItems: (value: RequestItem[]) => void
  setAccounts: (value: Account[]) => void
  setPersonaData: (value: { value: string; field: string }[]) => void
  setPersonaLabel: (value: string) => void
  setDappName: (value: string) => void
  destroy: () => void
  disconnect: () => void
}
