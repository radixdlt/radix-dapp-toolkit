import { EntityMetadataItem, SubintentStatus, TransactionStatus } from './types'
import { fetchWrapper } from '../../helpers'
import { __VERSION__ } from '../../version'
import { GatewayApiClientConfig } from '../../_types'

export type GatewayApiService = ReturnType<typeof GatewayApiService>

export const GatewayApiService = ({
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

  const getSubintentStatus = (subintentHash: string) =>
    fetchWithHeaders<{
      subintent_status: SubintentStatus
      finalized_at_transaction_intent_hash: string
    }>('/transaction/subintent-status', {
      subintent_hash: subintentHash,
    })

  const getEntityMetadataPage = (address: string) =>
    fetchWithHeaders<{
      items: EntityMetadataItem[]
    }>('/state/entity/page/metadata', { address })

  return {
    getSubintentStatus,
    getTransactionStatus,
    getEntityMetadataPage,
  }
}
