import { ResultAsync, err } from 'neverthrow'
import { rdt } from '../rdt/rdt'

export type GatewayService = ReturnType<typeof GatewayService>

export const GatewayService = () => {
  const getEntityDetails = (address: string) =>
    ResultAsync.fromPromise(
      rdt.gatewayApi.state.getEntityDetailsVaultAggregated(address),
      (e: unknown) => e as Error
    )

  return {
    getEntityOwnerKeys: (address: string) =>
      getEntityDetails(address).map(
        (response) =>
          response?.metadata?.items.find((item) => item.key === 'owner_keys')
            ?.value.raw_hex ?? ''
      ),
  }
}
