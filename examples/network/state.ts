import { BehaviorSubject } from 'rxjs'
import { createObservableHook } from '../helpers/create-observable-hook'
import { appLogger } from '../logger/state'
import {
  GatewayApiClient,
  RadixNetwork,
  RadixNetworkConfigById,
} from '@radixdlt/babylon-gateway-api-sdk'

export const bootstrapNetwork = (networkId: number) => {
  const gatewayApi = GatewayApiClient.initialize({
    basePath: RadixNetworkConfigById[networkId].gatewayUrl,
  })
  gatewayApi.status.getNetworkConfiguration().then((response) => {
    appLogger.debug({
      ...response,
      gateway: RadixNetworkConfigById[networkId].gatewayUrl,
    })
    return xrdAddress.next(response.well_known_addresses.xrd)
  })
}

const xrdAddress = new BehaviorSubject<string | undefined>(undefined)

export const useXrdAddress = createObservableHook(xrdAddress, '')

const getNetworkIdDefault = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const networkId = parseInt(
    urlParams.get('networkId') ||
      localStorage.getItem('networkId') ||
      RadixNetwork.RCnetV2.toString(),
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
