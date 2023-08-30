import { RadixNetwork } from '@radixdlt/babylon-gateway-api-sdk'

export const DEFAULT_NETWORK_ID = RadixNetwork.Enkinet.toString()

export const getNetworkId = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const networkId = parseInt(
    urlParams.get('networkId') || DEFAULT_NETWORK_ID,
    10
  )
  return networkId
}
