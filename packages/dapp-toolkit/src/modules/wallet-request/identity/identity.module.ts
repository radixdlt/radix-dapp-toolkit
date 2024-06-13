import { ResultAsync, err, ok, okAsync } from 'neverthrow'
import { StorageModule } from '../../storage/local-storage.module'
import type { KeyPairProvider } from '../crypto'
import { createSignatureMessage } from '../crypto/create-signature-message'

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
    getIdentity(kind)
      .andThen((keyPair) => (keyPair ? okAsync(keyPair) : createIdentity(kind)))
      .mapErr((error) => ({
        reason: 'couldNotGetOrCreateIdentity',
        jsError: error,
      }))

  const deriveSharedSecret = (kind: IdentityKind, publicKey: string) =>
    getIdentity(kind)
      .mapErr(() => ({ reason: 'couldNotDeriveSharedSecret' }))
      .andThen((identity) =>
        identity
          ? identity.x25519.calculateSharedSecret(publicKey).mapErr(() => ({
              reason: 'FailedToDeriveSharedSecret',
            }))
          : err({ reason: 'DappIdentityNotFound' }),
      )

  const createSignature = ({
    kind,
    interactionId,
    dAppDefinitionAddress,
    origin,
  }: {
    kind: IdentityKind
    interactionId: string
    dAppDefinitionAddress: string
    origin: string
  }): ResultAsync<
    { signature: string; publicKey: string },
    {
      reason: string
      jsError: Error
    }
  > =>
    getOrCreateIdentity(kind).andThen((identity) =>
      createSignatureMessage({
        interactionId,
        dAppDefinitionAddress,
        origin,
      }).andThen((message) =>
        identity.ed25519
          .sign(message)
          .map((signature) => ({
            signature,
            publicKey: identity.x25519.getPublicKey(),
            identity: identity.ed25519.getPublicKey(),
          }))
          .mapErr((error) => ({
            reason: 'couldNotSignMessage',
            jsError: error,
          })),
      ),
    )

  return {
    get: (kind: IdentityKind) => getOrCreateIdentity(kind),
    deriveSharedSecret,
    createSignature,
  }
}
