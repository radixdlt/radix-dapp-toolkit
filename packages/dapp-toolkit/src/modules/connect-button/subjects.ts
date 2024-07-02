import type { Account, RequestItem } from 'radix-connect-common'
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs'
import { isMobile } from '../../helpers'
import { ConnectButtonStatus } from './types'

export type ConnectButtonSubjects = ReturnType<typeof ConnectButtonSubjects>
export const ConnectButtonSubjects = () => ({
  onConnect: new Subject<{ challenge: string } | undefined>(),
  onDisconnect: new Subject<void>(),
  onUpdateSharedAccounts: new Subject<void>(),
  connected: new ReplaySubject<boolean>(1),
  requestItems: new BehaviorSubject<RequestItem[]>([]),
  onCancelRequestItem: new Subject<string>(),
  onIgnoreTransactionItem: new Subject<string>(),
  accounts: new BehaviorSubject<Account[]>([]),
  onShowPopover: new Subject<void>(),
  status: new BehaviorSubject<ConnectButtonStatus>('default'),
  loggedInTimestamp: new BehaviorSubject<string>(''),
  isMobile: new BehaviorSubject<boolean>(isMobile()),
  isWalletLinked: new BehaviorSubject<boolean>(false),
  showPopoverMenu: new BehaviorSubject<boolean>(false),
  isExtensionAvailable: new BehaviorSubject<boolean>(false),
  fullWidth: new BehaviorSubject<boolean>(false),
  activeTab: new BehaviorSubject<'sharing' | 'requests'>('sharing'),
  mode: new BehaviorSubject<'light' | 'dark'>('light'),
  theme: new BehaviorSubject<
    'radix-blue' | 'black' | 'white' | 'white-with-outline'
  >('radix-blue'),
  avatarUrl: new BehaviorSubject<string>(''),
  personaLabel: new BehaviorSubject<string>(''),
  personaData: new BehaviorSubject<{ value: string; field: string }[]>([]),
  dAppName: new BehaviorSubject<string>(''),
  onLinkClick: new Subject<{
    type: 'account' | 'transaction' | 'setupGuide' | 'showQrCode' | 'getWallet'
    data: string
  }>(),
})
