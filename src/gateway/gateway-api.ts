import {
  TransactionApi,
  Configuration,
  StateApi,
  StateEntityDetailsResponseItem,
  FungibleResourcesCollection,
  FungibleResourcesCollectionItemVaultAggregated,
  NonFungibleResourcesCollection,
  NonFungibleResourcesCollectionItemVaultAggregated,
  StateEntityDetailsResponse,
} from '@radixdlt/babylon-gateway-api-sdk'
import { ResultAsync } from 'neverthrow'
import { errorIdentity } from '../helpers/error-identity'

export type GatewayApiClient = ReturnType<typeof GatewayApiClient>

export type FungibleResourcesVaultCollection = Omit<
  FungibleResourcesCollection,
  'items'
> & {
  items: FungibleResourcesCollectionItemVaultAggregated[]
}

export type NonFungibleResourcesVaultCollection = Omit<
  NonFungibleResourcesCollection,
  'items'
> & {
  items: NonFungibleResourcesCollectionItemVaultAggregated[]
}

export type StateEntityDetailsVaultResponseItem =
  StateEntityDetailsResponseItem & {
    fungible_resources: FungibleResourcesVaultCollection
    non_fungible_resources: NonFungibleResourcesVaultCollection
  }

export const GatewayApiClient = (basePath: string) => {
  const configuration = new Configuration({ basePath })
  const transactionApi = new TransactionApi(configuration)
  const stateApi = new StateApi(configuration)

  const getTransactionStatus = (transactionIntentHashHex: string) =>
    ResultAsync.fromPromise(
      transactionApi.transactionStatus({
        transactionStatusRequest: {
          intent_hash_hex: transactionIntentHashHex,
        },
      }),
      errorIdentity
    )

  const getTransactionDetails = (
    transactionIntentHashHex: string,
    stateVersion?: number
  ) =>
    ResultAsync.fromPromise(
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
      }),
      errorIdentity
    )

  const getEntityDetails = (address: string) =>
    ResultAsync.fromPromise(
      stateApi
        .stateEntityDetails({
          stateEntityDetailsRequest: {
            addresses: [address],
            aggregation_level: 'Vault',
          },
        })
        .then(({ items }) => items[0] as StateEntityDetailsVaultResponseItem),
      errorIdentity
    )

  const getEntitiesDetails = (addresses: string[]) =>
    ResultAsync.fromPromise(
      stateApi.stateEntityDetails({
        stateEntityDetailsRequest: { addresses, aggregation_level: 'Vault' },
      }) as Promise<
        StateEntityDetailsResponse & {
          items: StateEntityDetailsVaultResponseItem[]
        }
      >,
      errorIdentity
    )

  const getEntityNonFungibleIds = ({
    accountAddress,
    nftAddress,
    vaultAddress,
  }: {
    accountAddress: string
    nftAddress: string
    vaultAddress: string
  }) =>
    ResultAsync.fromPromise(
      stateApi.entityNonFungibleIdsPage({
        stateEntityNonFungibleIdsPageRequest: {
          address: accountAddress,
          vault_address: vaultAddress,
          resource_address: nftAddress,
        },
      }),
      errorIdentity
    )

  return {
    getTransactionStatus,
    getTransactionDetails,
    getEntityDetails,
    getEntitiesDetails,
    getEntityNonFungibleIds,
    transactionApi,
    stateApi,
  }
}
