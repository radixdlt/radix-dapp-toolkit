import { EntityMetadataItem, TransactionStatus } from './types'
import { fetchWrapper } from '../helpers'
import { __VERSION__ } from '../version'
import { GatewayApiClientConfig } from '../_types'

export type GatewayApiClient = ReturnType<typeof GatewayApiClient>

export const GatewayApiClient = ({
  basePath,
  applicationName,
  applicationVersion,
  applicationDappDefinitionAddress,
}: GatewayApiClientConfig) => {
  const fetchWithHeaders = <T>(url: string, body: any) =>
    fetchWrapper<T>(
      fetch(`${basePath}${url}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'RDX-Client-Name': '@radixdlt/radix-dapp-toolkit',
          'RDX-Client-Version': __VERSION__,
          'RDX-App-Name': applicationName,
          'RDX-App-Version': applicationVersion,
          'RDX-App-Dapp-Definition': applicationDappDefinitionAddress,
        } as Record<string, string>,
      }),
    ).map((response) => response.data)

  const getTransactionStatus = (transactionIntentHash: string) =>
    fetchWithHeaders<{ status: TransactionStatus }>('/transaction/status', {
      intent_hash: transactionIntentHash,
    })

  const getEntityMetadataPage = (address: string) =>
    fetchWithHeaders<{
      items: EntityMetadataItem[]
    }>('/state/entity/page/metadata', { address })

  return {
    getTransactionStatus,
    getEntityMetadataPage,
  }
}
