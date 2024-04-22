import { err, ok, okAsync } from 'neverthrow'
import { StorageProvider } from '../../storage/local-storage-client'
import type { KeyPairProvider } from '../crypto'

export const IdentityKind = {
  dApp: 'dApp',
} as const
export type IdentityKind = (typeof IdentityKind)[keyof typeof IdentityKind]
export type IdentitySecret = { secret: string; createdAt: number }
export type IdentityStore = {
  [IdentityKind.dApp]: IdentitySecret
}

export type IdentityClient = ReturnType<typeof IdentityClient>
export const IdentityClient = (input: {
  providers: {
    storageClient: StorageProvider<IdentitySecret>
    KeyPairClient: KeyPairProvider
  }
}) => {
  const { storageClient, KeyPairClient } = input.providers

  const keyPairFromSecret = (input: string) => ok(KeyPairClient(input))

  const getIdentity = (kind: IdentityKind) =>
    storageClient
      .getItemById(kind)
      .andThen((identity) =>
        identity ? keyPairFromSecret(identity.secret) : okAsync(undefined),
      )

  const createIdentity = (kind: IdentityKind) =>
    ok(KeyPairClient()).asyncAndThen((keyPair) =>
      storageClient
        .setItems({
          [kind]: {
            secret: keyPair.getPrivateKey(),
            createdAt: Date.now(),
          },
        })
        .map(() => keyPair),
    )

  const getOrCreateIdentity = (kind: IdentityKind) =>
    getIdentity(kind).andThen((keyPair) =>
      keyPair ? okAsync(keyPair) : createIdentity(kind),
    )

  const deriveSharedSecret = (kind: IdentityKind, publicKey: string) =>
    getIdentity(kind)
      .mapErr(() => ({ reason: 'couldNotDeriveSharedSecret' }))
      .andThen((identity) =>
        identity
          ? identity.calculateSharedSecret(publicKey).mapErr(() => ({
              reason: 'FailedToDeriveSharedSecret',
            }))
          : err({ reason: 'DappIdentityNotFound' }),
      )

  return {
    get: (kind: IdentityKind) => getOrCreateIdentity(kind),
    deriveSharedSecret,
  }
}
