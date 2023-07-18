import {
  RadixNetwork,
  RadixNetworkConfig,
} from '@radixdlt/babylon-gateway-api-sdk'

const normalizeBasePath = (basePath?: string) => {
  if (!basePath) return ''
  return basePath.endsWith('/') ? basePath?.slice(0, -1) : basePath
}

export const networkIdMap = new Map<number, string>()
  .set(
    RadixNetwork.RCnetV1,
    normalizeBasePath(RadixNetworkConfig.RCnetV1?.gatewayUrl || '')
  )
  .set(
    RadixNetwork.RCnetV2,
    normalizeBasePath(RadixNetworkConfig.RCnetV2?.gatewayUrl || '')
  )
  .set(
    RadixNetwork.Enkinet,
    normalizeBasePath(RadixNetworkConfig.Enkinet?.gatewayUrl || '')
  )
  .set(
    RadixNetwork.Hammunet,
    normalizeBasePath(RadixNetworkConfig.Hammunet?.gatewayUrl || '')
  )
