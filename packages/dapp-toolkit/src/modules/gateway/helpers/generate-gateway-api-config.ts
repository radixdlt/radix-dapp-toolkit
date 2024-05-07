import { RadixNetworkConfigById } from '../types'

export const generateGatewayApiConfig = ({
  networkId,
  dAppDefinitionAddress,
  gatewayBaseUrl,
  applicationName,
  applicationVersion,
}: {
  networkId: number
  dAppDefinitionAddress: string
  gatewayBaseUrl?: string
  applicationName?: string
  applicationVersion?: string
}) => ({
  basePath: gatewayBaseUrl ?? RadixNetworkConfigById[networkId].gatewayUrl,
  applicationName: applicationName ?? 'Unknown',
  applicationVersion: applicationVersion ?? 'Unknown',
  applicationDappDefinitionAddress: dAppDefinitionAddress,
})
