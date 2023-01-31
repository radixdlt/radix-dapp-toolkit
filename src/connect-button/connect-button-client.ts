import { filter, first, map, merge, of, Subscription, tap, timer } from 'rxjs'
import { Logger } from 'tslog'
import { ConnectButton } from '@radixdlt/connect-button'
import { ConnectButtonProvider } from '../_types'
import { ConnectButtonSubjects } from './subjects'

type ConnectButtonElement = HTMLElement &
  Pick<ConnectButton, 'onConnect' | 'onDisconnect' | 'loading' | 'connected'>

export type ConnectButtonClient = ReturnType<typeof ConnectButtonClient>

export const ConnectButtonClient = (input: {
  onConnect?: (done: (input?: { challenge: string }) => void) => void
  subjects?: ConnectButtonSubjects
  logger?: Logger<unknown>
}): ConnectButtonProvider => {
  const subjects = input.subjects || ConnectButtonSubjects()
  const logger = input.logger
  const onConnectDefault = (done: (input?: { challenge: string }) => void) => {
    done()
  }
  const onConnect = input.onConnect || onConnectDefault

  const getConnectButtonElement = (): ConnectButtonElement | null =>
    document.querySelector('radix-connect-button')

  const subscriptions = new Subscription()

  subscriptions.add(
    merge(of(null), timer(0, 100))
      .pipe(
        map(() => getConnectButtonElement()),
        filter((element): element is ConnectButtonElement => !!element),
        first(),
        tap((connectButtonElement) => {
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
        })
      )
      .subscribe()
  )

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
