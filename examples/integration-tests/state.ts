import { BehaviorSubject } from 'rxjs'
import { createObservableHook } from '../helpers/create-observable-hook'

export type GumballMachineComponentState = {
  address: string
  ownerAccountAddress: string
  entities: {
    adminBadge: string
    gumballToken: string
  }
  gumballPrice: number
  gumballFlavour: string
}

export type GumballMachineState = {
  gumballMachinePackageAddress: string
  components: Record<string, GumballMachineComponentState>
}

const gumballMachineStateDefaults = {
  gumballMachinePackageAddress: '',
  components: {},
} satisfies GumballMachineState

const getGumballMachineState = (): GumballMachineState => {
  try {
    const raw = localStorage.getItem('gumballMachineState')
    if (!raw) return gumballMachineStateDefaults
    const parsed = JSON.parse(raw) as unknown as GumballMachineState
    return parsed
  } catch (_) {
    return gumballMachineStateDefaults
  }
}

const gumballMachineState = new BehaviorSubject<GumballMachineState>(
  getGumballMachineState()
)

export const useGumballMachineState = createObservableHook(
  gumballMachineState,
  getGumballMachineState()
)

export const addGumballMachineComponent = (value: GumballMachineComponentState) => {
  const state = getGumballMachineState()
  state.components[value.address] = value
  setGumballMachineState(state)
}

export const setGumballPrice = (componentAddress: string, price: number) => {
  const state = getGumballMachineState()
  state.components[componentAddress].gumballPrice = price
  setGumballMachineState(state)
}

export const setGumballMachineState = (value: GumballMachineState) => {
  localStorage.setItem('gumballMachineState', JSON.stringify(value))
  gumballMachineState.next(value)
}
