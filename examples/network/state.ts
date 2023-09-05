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
    applicationName: 'Radix Sandbox dApp',
  })
  gatewayApi.status.getNetworkConfiguration().then((response) => {
    appLogger.debug({
      ...response,
      gateway: RadixNetworkConfigById[networkId].gatewayUrl,
    })
    xrdAddress.next(response.well_known_addresses.xrd)
    poolPackageAddress.next(
      response.well_known_addresses.pool_package ||
        'package_tdx_22_1pkgxxxxxxxxxplxxxxxxxxxxxxx020379220524xxxxxxxxx5xy7q7'
    )
  })
}

const poolPackageAddress = new BehaviorSubject<string>('')
const xrdAddress = new BehaviorSubject<string>('')

export const useXrdAddress = createObservableHook<string>(xrdAddress, '')
export const usePoolPackageAddress = createObservableHook<string>(
  poolPackageAddress,
  ''
)

const getNetworkIdDefault = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const networkId = parseInt(
    urlParams.get('networkId') ||
      localStorage.getItem('networkId') ||
      RadixNetwork.RCnetV3.toString(),
    10
  )
  return networkId
}

export const networkId = new BehaviorSubject<number>(getNetworkIdDefault())

export const setNetworkId = (value: number) => {
  localStorage.setItem('networkId', `${value}`)
  location.reload()
}

export const useNetworkId = createObservableHook(
  networkId,
  getNetworkIdDefault()
)
