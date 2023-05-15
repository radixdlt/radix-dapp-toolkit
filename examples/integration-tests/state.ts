import { BehaviorSubject } from 'rxjs'
import { createObservableHook } from '../helpers/create-observable-hook'

export type GumballMachineState = {
  gumballMachinePackageAddress: string
  components: {
    address: string
    ownerAccountAddress: string
    entities: string[]
  }[]
}

const gumballMachineStateDefaults = {
  gumballMachinePackageAddress: '',
  components: [],
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

export const setGumballMachineState = (value: GumballMachineState) => {
  localStorage.setItem('gumballMachineState', JSON.stringify(value))
  gumballMachineState.next(value)
}
