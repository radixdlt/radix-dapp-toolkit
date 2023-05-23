import { BehaviorSubject } from 'rxjs'
import { ResultAsync, errAsync, okAsync } from 'neverthrow'
import { rdt } from '../rdt/rdt'
import {
  EntityMetadataItem,
  FungibleResourcesCollectionItemVaultAggregated,
  NonFungibleResourcesCollectionItemVaultAggregated,
  StateEntityDetailsResponseComponentDetails,
} from '@radixdlt/babylon-gateway-api-sdk'
import { createObservableHook } from '../helpers/create-observable-hook'

const entityType = {
  account: 'account',
  identity: 'identity',
  fungibleToken: 'fungibleToken',
  nftCollection: 'nftCollection',
  nft: 'nft',
  component: 'component',
} as const

type Entity = {
  [entityType.account]: {
    entityType: typeof entityType.account
    address: string
    fungibleTokens: Omit<Entity['fungibleToken'], 'metadata' | 'entityType'>[]
    nftCollections: Omit<Entity['nftCollection'], 'metadata' | 'entityType'>[]
    metadata: EntityMetadataItem[]
  }
  [entityType.identity]: {
    entityType: typeof entityType.identity
    address: string
    metadata: EntityMetadataItem[]
  }
  [entityType.fungibleToken]: {
    entityType: typeof entityType.fungibleToken
    address: string
    value: number
    metadata: EntityMetadataItem[]
  }
  [entityType.nftCollection]: {
    entityType: typeof entityType.nftCollection
    address: string
    vaultAddress: string
    totalCount: number
    metadata: EntityMetadataItem[]
  }
  [entityType.nft]: {
    entityType: typeof entityType.nft
    address: string
    nftId: string
    nftCollectionAddress: string
    ownerAddress: string
  }
  [entityType.component]: {
    entityType: typeof entityType.component
    address: string
    metadata: EntityMetadataItem[]
    fungibleTokens: Omit<Entity['fungibleToken'], 'metadata' | 'entityType'>[]
    nftCollections: Omit<Entity['nftCollection'], 'metadata' | 'entityType'>[]
    details: {
      type: 'Component'
    } & StateEntityDetailsResponseComponentDetails
  }
}

type EntityKind = Entity[keyof typeof entityType]

type EntityCollections = {
  [EntityType in keyof typeof entityType]: Record<string, Entity[EntityType]>
}

type AddEntityToCollectionInputKinds = {
  [entityType.account]: {
    address: string
    type: (typeof entityType)['account']
  }
  [entityType.identity]: {
    address: string
    type: (typeof entityType)['identity']
  }
  [entityType.fungibleToken]: {
    address: string
    value: number
    type: (typeof entityType)['fungibleToken']
  }
  [entityType.nftCollection]: {
    address: string
    ownerAddress: string
    vaultAddress: string
    totalCount: number
    type: (typeof entityType)['nftCollection']
  }
  [entityType.nft]: {
    nftId: string
    address: string
    nftCollectionsAddress: string
    ownerAddress: string
    type: (typeof entityType)['nft']
  }
  [entityType.component]: {
    address: string
    type: (typeof entityType)['component']
  }
}

type AddEntityToCollectionInput =
  AddEntityToCollectionInputKinds[keyof AddEntityToCollectionInputKinds]

const transformFungibleResourceItemResponse = (
  item: FungibleResourcesCollectionItemVaultAggregated
) => ({
  address: item.resource_address,
  value: item.vaults.items.reduce((acc, curr) => acc + Number(curr.amount), 0),
})

const transformNftResourceItemResponse = (
  item: NonFungibleResourcesCollectionItemVaultAggregated
) => ({
  address: item.resource_address,
  vaultAddress: item.vaults.items[0].vault_address,
  totalCount: item.vaults.items[0].total_count,
})

const defaultEntitiesState = {
  account: {},
  identity: {},
  fungibleToken: {},
  nftCollection: {},
  nft: {},
  component: {},
} satisfies EntityCollections

const entitiesState = new BehaviorSubject<EntityCollections>(
  defaultEntitiesState
)

const setEntities = (entities: EntityCollections) => {
  entitiesState.next(entities)
}

const fetchEntity = (entity: AddEntityToCollectionInput) =>
  rdt.gatewayApi
    .getEntityDetails(entity.address)
    .andThen(
      ({
        fungible_resources,
        non_fungible_resources,
        metadata,
        details,
      }): ResultAsync<EntityKind[], Error> => {
        const fungibleTokens = fungible_resources.items.map(
          transformFungibleResourceItemResponse
        )

        const nftCollections =
          entity.type === 'account'
            ? non_fungible_resources.items.map(
                (item: NonFungibleResourcesCollectionItemVaultAggregated) => ({
                  ...transformNftResourceItemResponse(item),
                  ownerAddress: entity.address,
                })
              )
            : []

        switch (entity.type) {
          case entityType.account:
            return okAsync([
              {
                entityType: entity.type,
                address: entity.address,
                metadata: metadata.items,
                fungibleTokens,
                nftCollections,
              } satisfies Entity['account'],
            ])

          case entityType.component:
            return okAsync([
              {
                entityType: entity.type,
                address: entity.address,
                metadata: metadata.items,
                fungibleTokens,
                nftCollections,
                details: details as Entity['component']['details'],
              } satisfies Entity['component'],
            ])

          case entityType.identity:
            return okAsync([
              {
                entityType: entity.type,
                address: entity.address,
                metadata: metadata.items,
              } satisfies Entity['identity'],
            ])

          case entityType.fungibleToken:
            return okAsync([
              {
                entityType: entity.type,
                address: entity.address,
                value: entity.value,
                metadata: metadata.items,
              } satisfies Entity['fungibleToken'],
            ])

          case entityType.nftCollection:
            return rdt.gatewayApi
              .getEntityNonFungibleIds({
                accountAddress: entity.ownerAddress,
                nftAddress: entity.address,
                vaultAddress: entity.vaultAddress,
              })
              .map((response) =>
                response.items.map(
                  (item) =>
                    ({
                      entityType: entityType.nft,
                      nftId: item.non_fungible_id,
                      address: `${entity.address}:${item.non_fungible_id}`,
                      nftCollectionAddress: entity.address,
                      ownerAddress: entity.ownerAddress,
                    } satisfies Entity['nft'])
                )
              )
              .map((items) => [
                {
                  entityType: entityType.nftCollection,
                  address: entity.address,
                  metadata: metadata.items,
                  vaultAddress: entity.vaultAddress,
                  totalCount: entity.totalCount,
                } satisfies Entity['nftCollection'],
                ...items,
              ])

          default: {
            return errAsync(new Error('Invalid entity type'))
          }
        }
      }
    )

const fetchEntities = (items: AddEntityToCollectionInput[]) =>
  ResultAsync.combine(items.map(fetchEntity)).map((items) => items.flat())

export const addEntities = (
  input: AddEntityToCollectionInput[],
  forceReload?: boolean
) => {
  const storedEntities = entitiesState.value
  const entitiesToFetch = input.filter(
    (item) => !storedEntities[item.type][item.address]
  )

  if (entitiesToFetch.length === 0 || forceReload) return

  fetchEntities(entitiesToFetch).map((items) => {
    const entities = items.reduce<EntityCollections>(
      (acc, curr) => ({
        ...acc,
        [curr.entityType]: { ...acc[curr.entityType], [curr.address]: curr },
      }),
      entitiesState.value
    )

    setEntities(entities)

    const childEntities = items.reduce<AddEntityToCollectionInput[]>(
      (acc, curr) => {
        if (
          !(
            [
              entityType.account,
              entityType.component,
            ] as (keyof typeof entityType)[]
          ).includes(curr.entityType)
        )
          return acc

        const item = curr as Entity['account'] | Entity['component']

        const fungibleTokens = item.fungibleTokens.map((fungibleToken) => ({
          type: entityType.fungibleToken,
          ...fungibleToken,
        })) satisfies AddEntityToCollectionInput[]

        const nftCollections = item.nftCollections.map((nftCollection) => ({
          type: entityType.nftCollection,
          ...nftCollection,
          ownerAddress: item.address,
        }))
        return [...acc, ...fungibleTokens, ...nftCollections]
      },
      []
    ) satisfies AddEntityToCollectionInput[]

    return addEntities(childEntities, forceReload)
  })
}

export const useEntities = createObservableHook(
  entitiesState,
  entitiesState.value
)
