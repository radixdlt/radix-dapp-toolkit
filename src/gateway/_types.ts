import { RadixNetworkConfig } from '@radixdlt/babylon-gateway-api-sdk'

export const networkIdMap = new Map<number, string>(
  Object.values(RadixNetworkConfig).map(({ networkId, gatewayUrl }) => [
    networkId,
    gatewayUrl,
  ])
)
