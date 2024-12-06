import { describe, it, expect } from 'vitest'
import { validateWalletResponse } from './validate-wallet-response'

describe('validateWalletResponse', () => {
  it('should parse valid response', () => {
    const walletResponse = {
      discriminator: 'success',
      interactionId: 'ab0f0190-1ae1-424b-a2c5-c36838f5b136',
      items: {
        discriminator: 'authorizedRequest',
        ongoingAccounts: {
          accounts: [
            {
              appearanceId: 0,
              label: 'S1',
              address:
                'account_tdx_2_128w9r3yel9pgk9vkmlg0wy6nsna9uhtw6dsfgrs8vsklqttjgx9c05',
            },
          ],
        },
        auth: {
          persona: {
            label: 'S1',
            identityAddress:
              'identity_tdx_2_1220nxz6va4u939286usk632ersvvd0y6m8xeyg6l09ays99env6u77',
          },
          challenge:
            '3f30f8d67ca69af8b646170d6ddd0a16cb501dcb7d457d0b49ef78a5d1b4beac',
          discriminator: 'loginWithChallenge',
          proof: {
            curve: 'curve25519',
            signature:
              'd3d049ec2722126bee265798b2daee3de46e398fd964cb08659c5fc434b1117d9e86dcde0b85c29f75f651878fe24fe326dc6536355c03d659268f17ce117b0b',
            publicKey:
              'eb670d10083535f9148ca065e05b8516e1284027a7ef6a37d5dd5ecd1f485bc5',
          },
        },
      },
    }

    const result = validateWalletResponse(walletResponse)

    expect(result.isOk() && result.value).toEqual(walletResponse)
  })

  it('should return error for invalid response', async () => {
    const walletResponse = {}

    const result = await validateWalletResponse(walletResponse)

    expect(result.isErr() && result.error).toEqual(
      expect.objectContaining({
        error: 'walletResponseValidation',
        message: 'Invalid input',
      }),
    )
  })
})
