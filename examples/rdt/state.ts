import { BehaviorSubject } from 'rxjs'
import { createObservableHook } from '../helpers/create-observable-hook'

export type ConnectButtonConfig = {
  theme: string
  mode: string
  width: number
  height: number
  borderRadius: number
}

const DEFAULT_CONNECT_BUTTON_CONFIG: ConnectButtonConfig = {
  theme: 'radix-blue',
  mode: 'light',
  width: 140,
  height: 40,
  borderRadius: 8,
}

export const connectButtonConfigSubject =
  new BehaviorSubject<ConnectButtonConfig>(DEFAULT_CONNECT_BUTTON_CONFIG)

export const useConnectButtonConfig = createObservableHook(
  connectButtonConfigSubject,
  DEFAULT_CONNECT_BUTTON_CONFIG
)

export const patchConnectButtonConfig = (
  value: Partial<ConnectButtonConfig>
) => {
  const currentValue = connectButtonConfigSubject.value
  connectButtonConfigSubject.next({ ...currentValue, ...value })
}
