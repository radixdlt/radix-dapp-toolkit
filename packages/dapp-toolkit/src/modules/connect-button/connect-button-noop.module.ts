import { NEVER } from 'rxjs'
import { ConnectButtonModuleOutput } from './types'

export const ConnectButtonNoopModule = (): ConnectButtonModuleOutput => {
  return {
    status$: NEVER,
    onConnect$: NEVER,
    onDisconnect$: NEVER,
    onUpdateSharedAccounts$: NEVER,
    onShowPopover$: NEVER,
    onCancelRequestItem$: NEVER,
    onLinkClick$: NEVER,
    setStatus: () => {},
    setMode: () => {},
    setTheme: () => {},
    setActiveTab: () => {},
    setIsMobile: () => {},
    setIsWalletLinked: () => {},
    setIsExtensionAvailable: () => {},
    setConnected: () => {},
    setLoggedInTimestamp: () => {},
    setRequestItems: () => {},
    setAccounts: () => {},
    setPersonaData: () => {},
    setPersonaLabel: () => {},
    setDappName: () => {},
    destroy: () => {},
    disconnect: () => {},
  }
}
