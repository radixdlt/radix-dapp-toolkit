import {
  RadixNetwork,
  RadixNetworkConfig,
} from '@radixdlt/babylon-gateway-api-sdk'
import { ENV_NETWORK_NAME } from '../config'

const networkId = RadixNetworkConfig?.[ENV_NETWORK_NAME]?.networkId

export const DEFAULT_NETWORK_ID =
  String(networkId) || RadixNetwork.Stokenet.toString()

export const getNetworkId = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const networkId = parseInt(
    urlParams.get('networkId') || DEFAULT_NETWORK_ID,
    10
  )
  return networkId
}
