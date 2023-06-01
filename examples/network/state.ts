import { BehaviorSubject } from 'rxjs'
import { createObservableHook } from '../helpers/create-observable-hook'
import { appLogger } from '../logger/state'
import { networkIdMap } from '../../src/gateway/_types'
import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk'

export const bootstrapNetwork = (networkId: number) => {
  const gatewayApi = GatewayApiClient.initialize({
    basePath: networkIdMap.get(networkId),
  })
  gatewayApi.status.getNetworkConfiguration().then((response) => {
    appLogger.debug({
      ...response,
      gateway: networkIdMap.get(response.network_id),
    })
    return xrdAddress.next(response.well_known_addresses.xrd)
  })
}

const xrdAddress = new BehaviorSubject<string | undefined>(undefined)

export const useXrdAddress = createObservableHook(xrdAddress, '')

const getNetworkIdDefault = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const networkId = parseInt(
    urlParams.get('networkId') || localStorage.getItem('networkId') || '34',
    10
  )
  return networkId
}

export const networkId = new BehaviorSubject<number>(getNetworkIdDefault())

export const setNetworkId = (value: number) => {
  localStorage.setItem('networkId', `${value}`)
  location.reload()
}

export const useNetworkId = createObservableHook(networkId, getNetworkIdDefault())
