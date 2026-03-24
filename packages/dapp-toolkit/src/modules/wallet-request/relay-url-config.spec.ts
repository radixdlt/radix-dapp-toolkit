import { describe, it, expect } from 'vitest'
import { parse } from 'valibot'
import { Metadata } from '../../schemas'
import { WalletRequestSdk } from './wallet-request-sdk'
import { EnvironmentModule } from '../environment'

const defaultRelayUrl = 'https://radix-connect-relay.radixdlt.com'
const customRelayUrl = 'https://my-relay.example.com'

describe('Relay URL configuration', () => {
  describe('Metadata schema', () => {
    it('should accept metadata with relayUrl', () => {
      const result = parse(Metadata, {
        version: 2,
        networkId: 1,
        dAppDefinitionAddress: 'account_rdx123',
        origin: 'https://example.com',
        relayUrl: defaultRelayUrl,
      })

      expect(result.relayUrl).toBe(defaultRelayUrl)
    })

    it('should reject metadata without relayUrl', () => {
      expect(() =>
        parse(Metadata, {
          version: 2,
          networkId: 1,
          dAppDefinitionAddress: 'account_rdx123',
          origin: 'https://example.com',
        }),
      ).toThrow()
    })
  })

  describe('WalletRequestSdk metadata', () => {
    it('should include default relayUrl in wallet interaction metadata', () => {
      const sdk = WalletRequestSdk({
        networkId: 1,
        dAppDefinitionAddress: 'account_rdx123',
        relayUrl: defaultRelayUrl,
        origin: 'https://example.com',
        providers: {
          transports: [],
          environmentModule: EnvironmentModule(),
        },
      })

      const interaction = sdk.createWalletInteraction({
        discriminator: 'authorizedRequest',
        auth: { discriminator: 'loginWithoutChallenge' },
      })

      expect(interaction.metadata.relayUrl).toBe(defaultRelayUrl)
    })

    it('should include custom relayUrl in wallet interaction metadata', () => {
      const sdk = WalletRequestSdk({
        networkId: 1,
        dAppDefinitionAddress: 'account_rdx123',
        relayUrl: customRelayUrl,
        origin: 'https://example.com',
        providers: {
          transports: [],
          environmentModule: EnvironmentModule(),
        },
      })

      const interaction = sdk.createWalletInteraction({
        discriminator: 'authorizedRequest',
        auth: { discriminator: 'loginWithoutChallenge' },
      })

      expect(interaction.metadata.relayUrl).toBe(customRelayUrl)
    })
  })
})
