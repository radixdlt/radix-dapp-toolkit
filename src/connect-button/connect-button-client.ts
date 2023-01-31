import { Subscription, tap } from 'rxjs'
import { Logger } from 'tslog'
import { ConnectButton } from '@radixdlt/connect-button'
import { ConnectButtonProvider } from '../_types'
import { ConnectButtonSubjects } from './subjects'

export type ConnectButtonClient = ReturnType<typeof ConnectButtonClient>

export const ConnectButtonClient = (input: {
  onConnect?: (done: (input?: { challenge: string }) => void) => void
  subjects?: ConnectButtonSubjects
  logger?: Logger<unknown>
  connectButtonElement?: HTMLElement &
    Pick<ConnectButton, 'onConnect' | 'onDisconnect' | 'loading' | 'connected'>
}): ConnectButtonProvider => {
  const connectButtonElement = input.connectButtonElement
  const subjects = input.subjects || ConnectButtonSubjects()
  const logger = input.logger
  const onConnectDefault = (done: (input?: { challenge: string }) => void) => {
    done()
  }
  const onConnect = input.onConnect || onConnectDefault

  const subscriptions = new Subscription()

  if (connectButtonElement) {
    logger?.debug(`🔎 connectButtonInstantiated`)
    import('@radixdlt/connect-button')

    connectButtonElement.onConnect = () => {
      onConnect((value) => subjects.onConnect.next(value))
    }

    connectButtonElement.onDisconnect = () => {
      subjects.onDisconnect.next()
    }

    subscriptions.add(
      subjects.loading
        .pipe(tap((value) => (connectButtonElement.loading = value)))
        .subscribe()
    )

    subscriptions.add(
      subjects.connected
        .pipe(tap((value) => (connectButtonElement.connected = value)))
        .subscribe()
    )
  }

  return {
    onConnect$: subjects.onConnect.asObservable(),
    onDisconnect$: subjects.onDisconnect.asObservable(),
    setLoading: (value: boolean) => subjects.loading.next(value),
    setConnected: (value: boolean) => subjects.connected.next(value),
    destroy: () => {
      subscriptions.unsubscribe()
    },
  }
}
