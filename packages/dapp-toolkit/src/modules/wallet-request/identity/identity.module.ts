import { err, ok, okAsync } from 'neverthrow'
import { StorageModule } from '../../storage/local-storage.module'
import type { KeyPairProvider } from '../crypto'

export const IdentityKind = {
  dApp: 'dApp',
} as const
export type IdentityKind = (typeof IdentityKind)[keyof typeof IdentityKind]
export type IdentitySecret = { secret: string; createdAt: number }
export type IdentityStore = {
  [IdentityKind.dApp]: IdentitySecret
}

export type IdentityModule = ReturnType<typeof IdentityModule>
export const IdentityModule = (input: {
  providers: {
    storageModule: StorageModule<IdentitySecret>
    KeyPairModule: KeyPairProvider
  }
}) => {
  const { storageModule, KeyPairModule } = input.providers

  const keyPairFromSecret = (input: string) => ok(KeyPairModule(input))

  const getIdentity = (kind: IdentityKind) =>
    storageModule
      .getItemById(kind)
      .andThen((identity) =>
        identity ? keyPairFromSecret(identity.secret) : okAsync(undefined),
      )

  const createIdentity = (kind: IdentityKind) =>
    ok(KeyPairModule()).asyncAndThen((keyPair) =>
      storageModule
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
