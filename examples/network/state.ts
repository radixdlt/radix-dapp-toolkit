import { BehaviorSubject } from 'rxjs'
import { rdt } from '../rdt/rdt'
import { createObservableHook } from '../helpers/create-observable-hook'
import { getNetworkId } from '../helpers/get-network-id'
import { appLogger } from '../logger/state'
import { networkIdMap } from '../../src/gateway/_types'

export const bootstrapNetwork = () => {
  rdt.gatewayApi
    .getNetworkConfiguration()
    .map((response) => {
      appLogger.debug({
        ...response,
        gateway: networkIdMap.get(response.network_id),
      })
      return xrdAddress.next(response.well_known_addresses.xrd)
    })
    .mapErr((error) => {
      throw error
    })
}

const xrdAddress = new BehaviorSubject<string | undefined>(undefined)

export const useXrdAddress = createObservableHook(xrdAddress, '')

const getNetworkIdDefault = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const networkId = parseInt(
    urlParams.get('networkId') || localStorage.getItem('networkId') || '12',
    10
  )
  return networkId
}

export const networkId = new BehaviorSubject<number>(getNetworkIdDefault())

export const setNetworkId = (value: number) => {
  localStorage.setItem('networkId', `${value}`)
  location.reload()
}

export const useNetworkId = createObservableHook(networkId, 12)
