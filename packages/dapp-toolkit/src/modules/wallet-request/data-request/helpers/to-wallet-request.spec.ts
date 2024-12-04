import { describe, expect, it } from 'vitest'
import { toWalletRequest } from './to-wallet-request'

describe('toWalletRequest', () => {
  it('should transform data request to wallet request', () => {
    const testCases: [any, any][] = [
      [
        {
          isConnect: true,
          oneTime: false,
          dataRequestState: {},
          walletData: {
            accounts: [],
            personaData: [],
            proofs: [],
          },
        },
        {
          auth: {
            discriminator: 'loginWithoutChallenge',
          },
          discriminator: 'authorizedRequest',
          reset: {
            accounts: false,
            personaData: false,
          },
        },
      ],
      [
        {
          isConnect: false,
          oneTime: true,
          challenge: 'abc',
          dataRequestState: {
            proofOfOwnership: {},
            accounts: {},
          },
          walletData: {
            persona: {},
          },
        },
        {
          auth: {
            discriminator: 'loginWithoutChallenge',
          },
          discriminator: 'authorizedRequest',
          oneTimeAccounts: {
            challenge: undefined,
            numberOfAccounts: {
              quantifier: 'atLeast',
              quantity: 1,
            },
          },
          proofOfOwnership: {
            challenge: 'abc',
          },
          reset: {
            accounts: false,
            personaData: false,
          },
        },
      ],
      [
        {
          isConnect: true,
          oneTime: false,
          challenge: 'abc',
          dataRequestState: {
            accounts: {
              withProof: true,
            },
            personaData: {
              reset: true,
            },
            persona: {
              withProof: true,
            },
          },
          walletData: {
            persona: {},
          },
        },
        {
          auth: {
            challenge: 'abc',
            discriminator: 'loginWithChallenge',
          },
          discriminator: 'authorizedRequest',
          ongoingAccounts: {
            challenge: 'abc',
            numberOfAccounts: {
              quantifier: 'atLeast',
              quantity: 1,
            },
          },
          ongoingPersonaData: {
            isRequestingName: undefined,
            numberOfRequestedEmailAddresses: undefined,
            numberOfRequestedPhoneNumbers: undefined,
          },
          reset: {
            accounts: false,
            personaData: false,
          },
        },
      ],
    ]

    testCases.forEach(([input, expected]) => {
      const result = toWalletRequest(input)
      expect(result.isOk() && result.value).toEqual(expected)
    })
  })
})
