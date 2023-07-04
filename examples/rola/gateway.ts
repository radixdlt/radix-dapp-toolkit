import { err } from 'neverthrow'
import { rdt } from '../rdt/rdt'

export type GatewayService = ReturnType<typeof GatewayService>

export const GatewayService = () => {
  return {
    getEntityOwnerKeys: (address: string) =>
      rdt.gatewayApi
        .getEntityDetails(address)
        .map(
          (response) =>
            response?.metadata?.items.find((item) => item.key === 'owner_keys')
              ?.value.raw_hex ?? ''
        ),
  }
}
