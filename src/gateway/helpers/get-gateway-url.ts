import { networkIdMap } from '../_types'

export const getGatewayBaseUrlByNetworkId = (networkId: number) => {
  const url = networkIdMap.get(networkId)
  if (!url) console.warn(`No gateway url found for networkId ${networkId}`)
  return url || ''
}
