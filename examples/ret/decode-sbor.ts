import { RadixEngineToolkit, SborValue } from '@radixdlt/radix-engine-toolkit'
import { ResultAsync } from 'neverthrow'
import { networkId } from '../network/state'
import { firstValueFrom } from 'rxjs'

export const sborDecode = (hexEncodedSchema: string) =>
  ResultAsync.fromPromise(
    firstValueFrom(networkId)
      .then(
        (id) =>
          RadixEngineToolkit.sborDecode(
            hexEncodedSchema,
            id
          ) as Promise<SborValue.ManifestSbor>
      )
      .then((value: SborValue.ManifestSbor) => value.manifestString),
    (err) => err as Error
  )
