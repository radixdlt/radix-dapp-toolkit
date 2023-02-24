import { networkIdMap } from '../_types'

export const getGatewayBaseUrlByNetworkId = (networkId: number) => {
  const url = networkIdMap.get(networkId)
  if (!url) throw new Error(`network id: ${networkId} not supported`)
  return url
}
