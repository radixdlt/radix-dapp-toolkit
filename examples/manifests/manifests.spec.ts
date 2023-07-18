import {
  InstructionList,
  RadixEngineToolkit,
  SborValue,
  TransactionManifest,
} from '@radixdlt/radix-engine-toolkit'
import { getCreateBadgeManifest } from './create-badge'
import { createToken } from './tokens'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getDeployPackageManifest } from './deploy-package'
import {
  getExample1,
  getExample2,
  getExample3,
  getExample4,
  getExample5,
  getExample6,
} from './examples'
import { GumballMachineTransactionManifests } from './gumball-machine'

describe('tx manifests', () => {
  const NETWORK_ID = 13
  const tokens = createToken(
    'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2'
  )
  const testManifest = async (stringManifest: string, blobs: string[] = []) => {
    let manifest = new TransactionManifest(
      new InstructionList.StringInstructions(stringManifest),
      blobs
    )

    await expect(
      manifest.convert(InstructionList.Kind.Parsed, NETWORK_ID)
    ).resolves.toBeDefined()
  }
  it('create badge', async () => {
    await testManifest(
      getCreateBadgeManifest(
        'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2'
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

  describe('deploy package', () => {
    it('should create valid deploy package manifest', async () => {
      const gumballMachine = readFileSync(
        join(__dirname, '../assets/gumball_machine.rpd')
      ).toString('hex')
      const gumballMachineWasm = readFileSync(
        join(__dirname, '../assets/gumball_machine.wasm')
      ).toString('hex')

      const sborDecodedSchema = (await RadixEngineToolkit.sborDecode(
        gumballMachine,
        NETWORK_ID
      )) as SborValue.ManifestSbor

      const stringManifest = getDeployPackageManifest({
        wasm: gumballMachineWasm,
        rpd: sborDecodedSchema.manifestString,
        nftAddress: 'TEST',
      })

      await testManifest(stringManifest, [gumballMachineWasm])
    })
  })

  describe('example manifests', () => {
    it('should create valid manifest for example 1', async () => {
      const example = getExample1(
        'resource_tdx_d_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxepwmma',
        {
          accountAlpha:
            'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
          accountBravo:
            'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
          componentAlpha: {
            address:
              'component_tdx_d_1cr30av9azlfc9ufnjvzhxj0dsnydgfy55dqq82pq2pgkqvshqdueq7',
            entities: {
              gumballToken:
                'resource_tdx_d_1tkx7f4tdf9zlqnhvtjrftddxvpjtvwqshjw5p9v0qslka44un68w6k',
            },
          } as any,
        }
      )
      await testManifest(example)
    })

    it('should create valid manifest for example 2', async () => {
      const example = getExample2(
        'resource_tdx_d_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxepwmma',
        {
          accountAlpha:
            'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
          accountBravo:
            'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
          componentAlpha: {
            address:
              'component_tdx_d_1cr30av9azlfc9ufnjvzhxj0dsnydgfy55dqq82pq2pgkqvshqdueq7',
            entities: {
              gumballToken:
                'resource_tdx_d_1tkx7f4tdf9zlqnhvtjrftddxvpjtvwqshjw5p9v0qslka44un68w6k',
            },
          } as any,
        }
      )
      await testManifest(example)
    })

    it('should create valid manifest for example 3', async () => {
      const example = getExample3(
        'resource_tdx_d_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxepwmma',
        {
          accountAlpha:
            'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
          accountBravo:
            'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
          componentAlpha: {
            address:
              'component_tdx_d_1cr30av9azlfc9ufnjvzhxj0dsnydgfy55dqq82pq2pgkqvshqdueq7',
            entities: {
              gumballToken:
                'resource_tdx_d_1tkx7f4tdf9zlqnhvtjrftddxvpjtvwqshjw5p9v0qslka44un68w6k',
            },
          } as any,
        }
      )
      await testManifest(example)
    })

    it('should create valid manifest for example 4', async () => {
      const example = getExample4(
        'resource_tdx_d_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxepwmma',
        {
          accountAlpha:
            'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
          accountBravo:
            'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
          componentAlpha: {
            address:
              'component_tdx_d_1cr30av9azlfc9ufnjvzhxj0dsnydgfy55dqq82pq2pgkqvshqdueq7',
            entities: {
              gumballToken:
                'resource_tdx_d_1tkx7f4tdf9zlqnhvtjrftddxvpjtvwqshjw5p9v0qslka44un68w6k',
              adminBadge:
                'resource_tdx_d_1tkx7f4tdf9zlqnhvtjrftddxvpjtvwqshjw5p9v0qslka44un68w6k',
            },
          } as any,
        }
      )
      await testManifest(example)
    })

    it('should create valid manifest for example 5', async () => {
      const example = getExample5(
        'resource_tdx_d_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxepwmma',
        {
          accountAlpha:
            'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
          accountBravo:
            'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
          componentAlpha: {
            address:
              'component_tdx_d_1cr30av9azlfc9ufnjvzhxj0dsnydgfy55dqq82pq2pgkqvshqdueq7',
            entities: {
              gumballToken:
                'resource_tdx_d_1tkx7f4tdf9zlqnhvtjrftddxvpjtvwqshjw5p9v0qslka44un68w6k',
              adminBadge:
                'resource_tdx_d_1tkx7f4tdf9zlqnhvtjrftddxvpjtvwqshjw5p9v0qslka44un68w6k',
            },
          } as any,
        }
      )
      await testManifest(example)
    })

    it('should create valid manifest for example 6', async () => {
      const example = getExample6(
        'resource_tdx_d_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxepwmma',
        {
          accountAlpha:
            'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
          accountBravo:
            'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
          componentAlpha: {
            address:
              'component_tdx_d_1cr30av9azlfc9ufnjvzhxj0dsnydgfy55dqq82pq2pgkqvshqdueq7',
            entities: {
              gumballToken:
                'resource_tdx_d_1tkx7f4tdf9zlqnhvtjrftddxvpjtvwqshjw5p9v0qslka44un68w6k',
            },
          } as any,
          componentBravo: {
            address:
              'component_tdx_d_1cr30av9azlfc9ufnjvzhxj0dsnydgfy55dqq82pq2pgkqvshqdueq7',
          } as any,
        }
      )
      await testManifest(example)
    })
  })

  describe('deploy gumball machine manifests', () => {
    const manifests = GumballMachineTransactionManifests({
      address:
        'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
      ownerAccountAddress:
        'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
      gumballFlavour: 'FLAV',
      gumballPrice: 1,
      entities: {
        adminBadge:
          'resource_tdx_d_1tkx7f4tdf9zlqnhvtjrftddxvpjtvwqshjw5p9v0qslka44un68w6k',
        staffBadge:
          'resource_tdx_d_1tkx7f4tdf9zlqnhvtjrftddxvpjtvwqshjw5p9v0qslka44un68w6k',
        gumballToken:
          'resource_tdx_d_1tkx7f4tdf9zlqnhvtjrftddxvpjtvwqshjw5p9v0qslka44un68w6k',
      },
    })
    it('should create valid `setPrice` manifest', () => {
      testManifest(manifests.setPrice(2))
    })
    it('should create valid `setRelatedEntities` manifest', () => {
      testManifest(manifests.setRelatedEntities())
    })
  })
})
