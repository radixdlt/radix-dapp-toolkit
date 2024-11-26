import { WalletDataRequestResponse } from '../wallet-to-rdt'

export const walletSuccessResponseToAuthorizedRequest = {
  discriminator: 'authorizedRequest',
  auth: {
    discriminator: 'loginWithChallenge',
    persona: {
      identityAddress:
        'identity_tdx_2_12twas58v4sthsmuky5653dup0drez3vcfwsfm6kp40qu9qyt8fgts6',
      label: 'Usdudh',
    },
    challenge:
      '069ef236486d4cd5706b5e5b168e19f750ffd1b4876529a0a9de966d50a15ab7',
    proof: {
      publicKey:
        'ff8aee4c625738e35d837edb11e33b8abe0d6f40849ca1451edaba84d04d0699',
      curve: 'curve25519',
      signature:
        '10177ac7d486691777133ffe59d46d55529d86cb1c4ce66aa82f432372f33e24d803d8498f42e26fe113c030fce68c526aeacff94334ba5a7f7ef84c2936eb05',
    },
  },
  oneTimeAccounts: {
    proofs: [
      {
        proof: {
          signature:
            '90c33d0ded5db913edc3c86e1ddf553acaefe17f115419081b3d82ca160289bc938c5246f28384de28250fe658b08ac17b4f531c3c7c9346c1867c1ac67d1402',
          publicKey:
            'eecf6843076e36faa896d13a95886dd2ace6c1ed84c173d4ca757c6674234e9f',
          curve: 'curve25519',
        },
        accountAddress:
          'account_tdx_2_129qprkuarea8mrtklr06g5ghdzgd2z6um4x8cxgu94hkt28taeaqxf',
      },
    ],
    challenge:
      'fee6ba63de936007c22465a43e91283a222c9168fab12236bd131b1a0010b8a0',
    accounts: [
      {
        address:
          'account_tdx_2_129qprkuarea8mrtklr06g5ghdzgd2z6um4x8cxgu94hkt28taeaqxf',
        label: 'A',
        appearanceId: 0,
      },
    ],
  },
  ongoingAccounts: {
    accounts: [
      {
        address:
          'account_tdx_2_129qeystv8tufmkmjrry2g6kadhhfh4f7rd0x3t9yagcvfhspt62paz',
        label: 'Spending Account',
        appearanceId: 0,
      },
      {
        address:
          'account_tdx_2_128928hvf6pjr3rx2xvdw6ulf7pc8g88ya8ma3j8dtjmntckz09fr3n',
        label: 'Savings Account',
        appearanceId: 1,
      },
    ],
    challenge:
      '069ef236486d4cd5706b5e5b168e19f750ffd1b4876529a0a9de966d50a15ab7',
    proofs: [
      {
        proof: {
          publicKey:
            '11b162e3343ce770b6e9ed8a29d125b5580d1272b0dc4e2bd0fcae33320d9566',
          curve: 'curve25519',
          signature:
            'e18617b527d4d33607a8adb6a040c26ca97642ec89dd8a6fe7a41fa724473e4cc69b0729c1df57aba77455801f2eef6f28848a5d206e3739de29ca2288957502',
        },
        accountAddress:
          'account_tdx_2_129qeystv8tufmkmjrry2g6kadhhfh4f7rd0x3t9yagcvfhspt62paz',
      },
      {
        proof: {
          publicKey:
            '5386353e4cc27e3d27d064d777d811e242a16ba7aefd425062ed46631739619d',
          curve: 'curve25519',
          signature:
            '0143fd941d51f531c8265b0f6b24f4cfcdfd24b40aac47dee6fb3386ce0d400563c892e3894a33840d1c7af2dd43ecd0729fd209171003765d109a04d7485605',
        },
        accountAddress:
          'account_tdx_2_128928hvf6pjr3rx2xvdw6ulf7pc8g88ya8ma3j8dtjmntckz09fr3n',
      },
    ],
  },
  ongoingPersonaData: {
    name: {
      variant: 'western',
      familyName: 'Family',
      givenNames: 'Given',
      nickname: 'Nick',
    },
    emailAddresses: ['some@gmail.com'],
    phoneNumbers: ['071234579'],
  },
} satisfies WalletDataRequestResponse

export const walletSuccessResponseToUnauthorizedRequest = {
  oneTimeAccounts: {
    accounts: [
      {
        address:
          'account_tdx_2_129qeystv8tufmkmjrry2g6kadhhfh4f7rd0x3t9yagcvfhspt62paz',
        label: 'Spending Account',
        appearanceId: 0,
      },
    ],
  },
  discriminator: 'unauthorizedRequest',
  oneTimePersonaData: {
    name: {
      variant: 'western',
      familyName: 'Family',
      givenNames: 'Given',
      nickname: 'Nick',
    },
    emailAddresses: ['some@gmail.com'],
    phoneNumbers: ['071234579'],
  },
} satisfies WalletDataRequestResponse

export const walletSuccessResponseToProofOfOwnershipRequest = {
  discriminator: 'authorizedRequest',
  auth: {
    discriminator: 'usePersona',
    persona: {
      identityAddress:
        'identity_tdx_2_12fat0nh0gymw9j4rqka5344p3h3r86x4z0hkw2v78r03pt0kfv0qva',
      label: 'pao13',
    },
  },
  proofOfOwnership: {
    challenge:
      'e280cfa39e1499f2862e59759cc2fc990cce28b70a7989324fe91c47814d0630',
    proofs: [
      {
        accountAddress:
          'account_tdx_2_12ytkalad6hfxamsz4a7r8tevz7ahurfj58dlp4phl4nca5hs0hpu90',
        proof: {
          publicKey:
            'ff8aee4c625738e35d837edb11e33b8abe0d6f40849ca1451edaba84d04d0699',
          curve: 'curve25519',
          signature:
            '10177ac7d486691777133ffe59d46d55529d86cb1c4ce66aa82f432372f33e24d803d8498f42e26fe113c030fce68c526aeacff94334ba5a7f7ef84c2936eb05',
        },
      },
      {
        identityAddress:
          'identity_tdx_2_12fat0nh0gymw9j4rqka5344p3h3r86x4z0hkw2v78r03pt0kfv0qva',
        proof: {
          publicKey:
            'ff8aee4c625738e35d837edb11e33b8abe0d6f40849ca1451edaba84d04d0699',
          curve: 'curve25519',
          signature:
            '10177ac7d486691777133ffe59d46d55529d86cb1c4ce66aa82f432372f33e24d803d8498f42e26fe113c030fce68c526aeacff94334ba5a7f7ef84c2936eb05',
        },
      },
    ],
  },
} satisfies WalletDataRequestResponse

export const walletSuccessResponseToUnauthorizedRequestWithChallengeForOneTimeAccount =
  {
    discriminator: 'unauthorizedRequest',
    oneTimeAccounts: {
      proofs: [
        {
          proof: {
            signature:
              '90c33d0ded5db913edc3c86e1ddf553acaefe17f115419081b3d82ca160289bc938c5246f28384de28250fe658b08ac17b4f531c3c7c9346c1867c1ac67d1402',
            publicKey:
              'eecf6843076e36faa896d13a95886dd2ace6c1ed84c173d4ca757c6674234e9f',
            curve: 'curve25519',
          },
          accountAddress:
            'account_tdx_2_129qprkuarea8mrtklr06g5ghdzgd2z6um4x8cxgu94hkt28taeaqxf',
        },
      ],
      challenge:
        'fee6ba63de936007c22465a43e91283a222c9168fab12236bd131b1a0010b8a0',
      accounts: [
        {
          address:
            'account_tdx_2_129qprkuarea8mrtklr06g5ghdzgd2z6um4x8cxgu94hkt28taeaqxf',
          label: 'A',
          appearanceId: 0,
        },
      ],
    },
  } satisfies WalletDataRequestResponse
