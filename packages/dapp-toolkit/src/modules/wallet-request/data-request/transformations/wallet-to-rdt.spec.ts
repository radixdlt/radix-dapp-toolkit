import { describe, expect, it } from 'vitest'
import { transformWalletResponseToRdtWalletData } from './wallet-to-rdt'
import {
  walletSuccessResponseToAuthorizedRequest,
  walletSuccessResponseToProofOfOwnershipRequest,
  walletSuccessResponseToUnauthorizedRequest,
  walletSuccessResponseToUnauthorizedRequestWithChallengeForOneTimeAccount,
} from './fixtures/wallet-interactions'

describe('transformWalletResponseToRdtWalletData', () => {
  describe('given success response for login request and ongoing access to accounts and persona data', () => {
    it('should produce correct wallet data', async () => {
      const result = await transformWalletResponseToRdtWalletData(
        walletSuccessResponseToAuthorizedRequest,
      )

      expect(result.isOk()).toBe(true)
      expect(result.isOk() && result.value).toEqual({
        accounts: [
          {
            address:
              'account_tdx_2_129qprkuarea8mrtklr06g5ghdzgd2z6um4x8cxgu94hkt28taeaqxf',
            appearanceId: 0,
            label: 'A',
          },
          {
            address:
              'account_tdx_2_129qeystv8tufmkmjrry2g6kadhhfh4f7rd0x3t9yagcvfhspt62paz',
            appearanceId: 0,
            label: 'Spending Account',
          },
          {
            address:
              'account_tdx_2_128928hvf6pjr3rx2xvdw6ulf7pc8g88ya8ma3j8dtjmntckz09fr3n',
            appearanceId: 1,
            label: 'Savings Account',
          },
        ],
        persona: {
          identityAddress:
            'identity_tdx_2_12twas58v4sthsmuky5653dup0drez3vcfwsfm6kp40qu9qyt8fgts6',
          label: 'Usdudh',
        },
        personaData: [
          {
            entry: 'fullName',
            fields: {
              familyName: 'Family',
              givenNames: 'Given',
              nickname: 'Nick',
              variant: 'western',
            },
          },
          {
            entry: 'emailAddresses',
            fields: ['some@gmail.com'],
          },
          {
            entry: 'phoneNumbers',
            fields: ['071234579'],
          },
        ],
        proofs: [
          {
            address:
              'identity_tdx_2_12twas58v4sthsmuky5653dup0drez3vcfwsfm6kp40qu9qyt8fgts6',
            challenge:
              '069ef236486d4cd5706b5e5b168e19f750ffd1b4876529a0a9de966d50a15ab7',
            proof: {
              curve: 'curve25519',
              publicKey:
                'ff8aee4c625738e35d837edb11e33b8abe0d6f40849ca1451edaba84d04d0699',
              signature:
                '10177ac7d486691777133ffe59d46d55529d86cb1c4ce66aa82f432372f33e24d803d8498f42e26fe113c030fce68c526aeacff94334ba5a7f7ef84c2936eb05',
            },
            type: 'persona',
          },
          {
            address:
              'account_tdx_2_129qeystv8tufmkmjrry2g6kadhhfh4f7rd0x3t9yagcvfhspt62paz',
            challenge:
              '069ef236486d4cd5706b5e5b168e19f750ffd1b4876529a0a9de966d50a15ab7',
            proof: {
              curve: 'curve25519',
              publicKey:
                '11b162e3343ce770b6e9ed8a29d125b5580d1272b0dc4e2bd0fcae33320d9566',
              signature:
                'e18617b527d4d33607a8adb6a040c26ca97642ec89dd8a6fe7a41fa724473e4cc69b0729c1df57aba77455801f2eef6f28848a5d206e3739de29ca2288957502',
            },
            type: 'account',
          },
          {
            address:
              'account_tdx_2_128928hvf6pjr3rx2xvdw6ulf7pc8g88ya8ma3j8dtjmntckz09fr3n',
            challenge:
              '069ef236486d4cd5706b5e5b168e19f750ffd1b4876529a0a9de966d50a15ab7',
            proof: {
              curve: 'curve25519',
              publicKey:
                '5386353e4cc27e3d27d064d777d811e242a16ba7aefd425062ed46631739619d',
              signature:
                '0143fd941d51f531c8265b0f6b24f4cfcdfd24b40aac47dee6fb3386ce0d400563c892e3894a33840d1c7af2dd43ecd0729fd209171003765d109a04d7485605',
            },
            type: 'account',
          },
          {
            address:
              'account_tdx_2_129qprkuarea8mrtklr06g5ghdzgd2z6um4x8cxgu94hkt28taeaqxf',
            challenge:
              'fee6ba63de936007c22465a43e91283a222c9168fab12236bd131b1a0010b8a0',
            proof: {
              curve: 'curve25519',
              publicKey:
                'eecf6843076e36faa896d13a95886dd2ace6c1ed84c173d4ca757c6674234e9f',
              signature:
                '90c33d0ded5db913edc3c86e1ddf553acaefe17f115419081b3d82ca160289bc938c5246f28384de28250fe658b08ac17b4f531c3c7c9346c1867c1ac67d1402',
            },
            type: 'account',
          },
        ],
      })
    })
  })

  describe('given success response for unathorized request', () => {
    it('should produce correct wallet data', async () => {
      const result = await transformWalletResponseToRdtWalletData(
        walletSuccessResponseToUnauthorizedRequest,
      )
      expect(result.isOk()).toBe(true)
      expect(result.isOk() && result.value).toEqual({
        accounts: [
          {
            address:
              'account_tdx_2_129qeystv8tufmkmjrry2g6kadhhfh4f7rd0x3t9yagcvfhspt62paz',
            appearanceId: 0,
            label: 'Spending Account',
          },
        ],
        persona: undefined,
        personaData: [
          {
            entry: 'fullName',
            fields: {
              familyName: 'Family',
              givenNames: 'Given',
              nickname: 'Nick',
              variant: 'western',
            },
          },
          {
            entry: 'emailAddresses',
            fields: ['some@gmail.com'],
          },
          {
            entry: 'phoneNumbers',
            fields: ['071234579'],
          },
        ],
        proofs: [],
      })
    })
  })

  describe('given success response for authorized request with proof of ownership', () => {
    it('should produce correct wallet data', async () => {
      const result = await transformWalletResponseToRdtWalletData(
        walletSuccessResponseToProofOfOwnershipRequest,
      )
      expect(result.isOk()).toBe(true)
      expect(result.isOk() && result.value).toEqual({
        accounts: [],
        persona: {
          identityAddress:
            'identity_tdx_2_12fat0nh0gymw9j4rqka5344p3h3r86x4z0hkw2v78r03pt0kfv0qva',
          label: 'pao13',
        },
        personaData: [],
        proofs: [
          {
            address:
              'account_tdx_2_12ytkalad6hfxamsz4a7r8tevz7ahurfj58dlp4phl4nca5hs0hpu90',
            challenge:
              'e280cfa39e1499f2862e59759cc2fc990cce28b70a7989324fe91c47814d0630',
            proof: {
              curve: 'curve25519',
              publicKey:
                'ff8aee4c625738e35d837edb11e33b8abe0d6f40849ca1451edaba84d04d0699',
              signature:
                '10177ac7d486691777133ffe59d46d55529d86cb1c4ce66aa82f432372f33e24d803d8498f42e26fe113c030fce68c526aeacff94334ba5a7f7ef84c2936eb05',
            },
            type: 'account',
          },
          {
            address:
              'identity_tdx_2_12fat0nh0gymw9j4rqka5344p3h3r86x4z0hkw2v78r03pt0kfv0qva',
            challenge:
              'e280cfa39e1499f2862e59759cc2fc990cce28b70a7989324fe91c47814d0630',
            proof: {
              curve: 'curve25519',
              publicKey:
                'ff8aee4c625738e35d837edb11e33b8abe0d6f40849ca1451edaba84d04d0699',
              signature:
                '10177ac7d486691777133ffe59d46d55529d86cb1c4ce66aa82f432372f33e24d803d8498f42e26fe113c030fce68c526aeacff94334ba5a7f7ef84c2936eb05',
            },
            type: 'persona',
          },
        ],
      })
    })
  })

  describe('given success response for unauthorized request with challenge for one time account', () => {
    it('should produce correct wallet data', async () => {
      const result = await transformWalletResponseToRdtWalletData(
        walletSuccessResponseToUnauthorizedRequestWithChallengeForOneTimeAccount,
      )
      expect(result.isOk()).toBe(true)
      expect(result.isOk() && result.value).toEqual({
        accounts: [
          {
            address:
              'account_tdx_2_129qprkuarea8mrtklr06g5ghdzgd2z6um4x8cxgu94hkt28taeaqxf',
            appearanceId: 0,
            label: 'A',
          },
        ],
        persona: undefined,
        personaData: [],
        proofs: [
          {
            address:
              'account_tdx_2_129qprkuarea8mrtklr06g5ghdzgd2z6um4x8cxgu94hkt28taeaqxf',
            challenge:
              'fee6ba63de936007c22465a43e91283a222c9168fab12236bd131b1a0010b8a0',
            proof: {
              curve: 'curve25519',
              publicKey:
                'eecf6843076e36faa896d13a95886dd2ace6c1ed84c173d4ca757c6674234e9f',
              signature:
                '90c33d0ded5db913edc3c86e1ddf553acaefe17f115419081b3d82ca160289bc938c5246f28384de28250fe658b08ac17b4f531c3c7c9346c1867c1ac67d1402',
            },
            type: 'account',
          },
        ],
      })
    })
  })
})
