import { describe, expect, it } from 'vitest'
import { transformRdtDataRequestToWalletRequest } from './rdt-to-wallet'

describe('transformRdtDataRequestToWalletRequest', () => {
  describe('given is connect request', () => {
    it('should transform RDT data request to wallet request', async () => {
      const result = await transformRdtDataRequestToWalletRequest(true, {
        proofOfOwnership: {
          challenge: 'challenge',
          accountAddresses: ['account_'],
          identityAddress: 'identity_',
        },
        accounts: {
          numberOfAccounts: {
            quantifier: 'atLeast',
            quantity: 1,
          },
          challenge: 'challenge',
          oneTime: false,
          reset: true,
        },
        personaData: {
          fullName: true,
          reset: true,
        },
      })

      expect(result.isOk() && result.value).toEqual({
        auth: {
          discriminator: 'loginWithoutChallenge',
        },
        discriminator: 'authorizedRequest',
        ongoingAccounts: {
          challenge: 'challenge',
          numberOfAccounts: {
            quantifier: 'atLeast',
            quantity: 1,
          },
        },
        ongoingPersonaData: {
          isRequestingName: true,
          numberOfRequestedEmailAddresses: undefined,
          numberOfRequestedPhoneNumbers: undefined,
        },
        proofOfOwnership: {
          accountAddresses: ['account_'],
          challenge: 'challenge',
          identityAddress: 'identity_',
        },
        reset: {
          accounts: false,
          personaData: false,
        },
      })
    })

    it('should produce correct result', async () => {
      const result = await transformRdtDataRequestToWalletRequest(true, {
        accounts: {
          numberOfAccounts: {
            quantifier: 'atLeast',
            quantity: 1,
          },
          challenge: 'challenge',
          oneTime: false,
          reset: true,
        },
        personaData: {
          fullName: true,
          reset: false,
        },
        persona: {
          identityAddress: 'identity_',
          label: 'label',
        },
      })

      expect(result.isOk() && result.value).toEqual({
        auth: {
          discriminator: 'usePersona',
          identityAddress: 'identity_',
        },
        discriminator: 'authorizedRequest',
        ongoingAccounts: {
          challenge: 'challenge',
          numberOfAccounts: {
            quantifier: 'atLeast',
            quantity: 1,
          },
        },
        ongoingPersonaData: {
          isRequestingName: true,
          numberOfRequestedEmailAddresses: undefined,
          numberOfRequestedPhoneNumbers: undefined,
        },
        reset: {
          accounts: false,
          personaData: false,
        },
      })
    })

    it('should produce correct result', async () => {
      const result = await transformRdtDataRequestToWalletRequest(true, {
        accounts: {
          numberOfAccounts: {
            quantifier: 'atLeast',
            quantity: 1,
          },
          challenge: 'challenge',
          oneTime: false,
          reset: true,
        },
        personaData: {
          fullName: true,
          reset: false,
        },
        persona: {
          identityAddress: 'identity_',
          label: 'label',
        },
      })

      expect(result.isOk() && result.value).toEqual({
        auth: {
          discriminator: 'usePersona',
          identityAddress: 'identity_',
        },
        discriminator: 'authorizedRequest',
        ongoingAccounts: {
          challenge: 'challenge',
          numberOfAccounts: {
            quantifier: 'atLeast',
            quantity: 1,
          },
        },
        ongoingPersonaData: {
          isRequestingName: true,
          numberOfRequestedEmailAddresses: undefined,
          numberOfRequestedPhoneNumbers: undefined,
        },
        reset: {
          accounts: false,
          personaData: false,
        },
      })
    })
  })

  describe('given is not connect request', () => {
    it('should transform RDT data request to wallet request', async () => {
      const result = await transformRdtDataRequestToWalletRequest(false, {
        persona: {
          challenge: 'abc',
        },
      })
      expect(result.isOk() && result.value).toEqual({
        auth: {
          challenge: 'abc',
          discriminator: 'loginWithChallenge',
        },
        discriminator: 'authorizedRequest',
        reset: {
          accounts: false,
          personaData: false,
        },
      })
    })

    it('should transform RDT data request to wallet request', async () => {
      const result = await transformRdtDataRequestToWalletRequest(false, {})
      expect(result.isOk() && result.value).toEqual({
        discriminator: 'unauthorizedRequest',
      })
    })

    it('should transform RDT data request to wallet request', async () => {
      const result = await transformRdtDataRequestToWalletRequest(false, {
        personaData: {
          oneTime: true,
          fullName: true,
          reset: true,
        },
      })
      expect(result.isOk() && result.value).toEqual({
        discriminator: 'authorizedRequest',
        auth: {
          discriminator: 'loginWithoutChallenge',
        },

        oneTimePersonaData: {
          isRequestingName: true,
          numberOfRequestedEmailAddresses: undefined,
          numberOfRequestedPhoneNumbers: undefined,
        },
        ongoingPersonaData: {
          isRequestingName: true,
          numberOfRequestedEmailAddresses: undefined,
          numberOfRequestedPhoneNumbers: undefined,
        },
        reset: {
          accounts: false,
          personaData: true,
        },
      })
    })
  })
})
