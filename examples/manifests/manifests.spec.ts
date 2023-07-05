import {
  InstructionList,
  TransactionManifest,
} from '@radixdlt/radix-engine-toolkit'
import { getCreateBadgeManifest } from './create-badge'
import { createToken } from './tokens'

describe('tx manifests', () => {
  const NETWORK_ID = 34
  const tokens = createToken(
    'account_tdx_22_12xt9uxe39dxdfy9c23vn0qj7eaxs8p3fjjpkr8f48edsfvyk00ck3l'
  )
  const testManifest = async (stringManifest: string) => {
    let manifest = new TransactionManifest(
      new InstructionList.StringInstructions(stringManifest),
      []
    )

    await expect(
      manifest.convert(InstructionList.Kind.Parsed, NETWORK_ID)
    ).resolves.toBeDefined()
  }
  it('create badge', async () => {
    await testManifest(
      getCreateBadgeManifest(
        'account_tdx_22_12xt9uxe39dxdfy9c23vn0qj7eaxs8p3fjjpkr8f48edsfvyk00ck3l'
      )
    )
  })

  it('create fungible token', async () => {
    await testManifest(
      tokens.fungible({
        name: 'TEST',
        symbol: 'TEST',
        description: 'TEST',
        iconUrl: 'TEST',
        initialSupply: 1000,
      })
    )
  })

  it('create nft', async () => {
    await testManifest(
      tokens.nft({
        name: 'TEST',
        items: ['First', 'Second', 'Third'],
        iconUrl: '',
        description: 'TEST',
      })
    )
  })
})
