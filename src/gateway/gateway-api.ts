import {
  TransactionApi,
  Configuration,
} from '@radixdlt/babylon-gateway-api-sdk'

export type GatewayApiClient = ReturnType<typeof GatewayApiClient>

export const GatewayApiClient = (basePath: string) => {
  const configuration = new Configuration({ basePath })
  const transactionApi = new TransactionApi(configuration)

  const getTransactionStatus = (transactionIntentHashHex: string) =>
    transactionApi.transactionStatus({
      transactionStatusRequest: {
        intent_hash_hex: transactionIntentHashHex,
      },
    })

  const getTransactionDetails = (
    transactionIntentHashHex: string,
    stateVersion?: number
  ) =>
    transactionApi.transactionCommittedDetails({
      transactionCommittedDetailsRequest: {
        intent_hash_hex: transactionIntentHashHex,
        ...(stateVersion
          ? {
              at_ledger_state: {
                state_version: stateVersion,
              },
            }
          : {}),
      },
    })

  return { getTransactionStatus, getTransactionDetails }
}
