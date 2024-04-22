export type TransactionStatus =
  (typeof TransactionStatus)[keyof typeof TransactionStatus]
export const TransactionStatus = {
  Unknown: 'Unknown',
  CommittedSuccess: 'CommittedSuccess',
  CommittedFailure: 'CommittedFailure',
  Pending: 'Pending',
  Rejected: 'Rejected',
} as const

export type MetadataStringValue = {
  type: 'String'
  value: string
}

export type MetadataTypedValue = { type: 'String' } & MetadataStringValue

export type EntityMetadataItemValue = {
  typed: MetadataTypedValue
}

export type EntityMetadataItem = {
  key: string

  value: EntityMetadataItemValue

  is_locked: boolean

  last_updated_at_state_version: number
}

export type TransactionStatusResponse = {
  status: TransactionStatus
}

export const RadixNetwork = {
  Mainnet: 0x01,
  Stokenet: 0x02,
  Gilganet: 0x20,
  Enkinet: 0x21,
  Hammunet: 0x22,
  Nergalnet: 0x23,
  Mardunet: 0x24,
  Dumunet: 0x25,
} as const

export type NetworkConfig = {
  networkName: string
  networkId: (typeof RadixNetwork)[keyof typeof RadixNetwork]
  gatewayUrl: string
  dashboardUrl: string
}

export const RadixNetworkConfig: Record<string, NetworkConfig> = {
  Mainnet: {
    networkName: 'Mainnet',
    networkId: RadixNetwork.Mainnet,
    gatewayUrl: 'https://mainnet.radixdlt.com',
    dashboardUrl: 'https://dashboard.radixdlt.com',
  },
  Stokenet: {
    networkName: 'Stokenet',
    networkId: RadixNetwork.Stokenet,
    gatewayUrl: 'https://babylon-stokenet-gateway.radixdlt.com',
    dashboardUrl: 'https://stokenet-dashboard.radixdlt.com',
  },

  Mardunet: {
    networkName: 'Mardunet',
    networkId: RadixNetwork.Mardunet,
    gatewayUrl: 'https://mardunet-gateway.radixdlt.com',
    dashboardUrl: 'https://mardunet-dashboard.rdx-works-main.extratools.works',
  },
  Gilganet: {
    networkName: 'Gilganet',
    networkId: RadixNetwork.Gilganet,
    gatewayUrl: 'https://gilganet-gateway.radixdlt.com',
    dashboardUrl: 'https://gilganet-dashboard.rdx-works-main.extratools.works',
  },
  Enkinet: {
    networkName: 'Enkinet',
    networkId: RadixNetwork.Enkinet,
    gatewayUrl: 'https://enkinet-gateway.radixdlt.com',
    dashboardUrl: 'https://enkinet-dashboard.rdx-works-main.extratools.works',
  },
  Hammunet: {
    networkName: 'Hammunet',
    networkId: RadixNetwork.Hammunet,
    gatewayUrl: 'https://hammunet-gateway.radixdlt.com',
    dashboardUrl: 'https://hammunet-dashboard.rdx-works-main.extratools.works',
  },
  Dumunet: {
    networkName: 'Dumunet',
    networkId: RadixNetwork.Dumunet,
    gatewayUrl: 'https://dumunet-gateway.radixdlt.com',
    dashboardUrl: 'https://dumunet-dashboard.rdx-works-main.extratools.works',
  },
}

export const RadixNetworkConfigById = Object.values(RadixNetworkConfig).reduce(
  (prev: Record<number, NetworkConfig>, config) => {
    prev[config.networkId] = config
    return prev
  },
  {},
)
