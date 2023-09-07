import { RadixNetwork } from '@radixdlt/babylon-gateway-api-sdk'
import { RadixEngineToolkit } from '@radixdlt/radix-engine-toolkit'
import { contributeToPoolManifest, createPoolManifest } from './manifests'

describe('pools manifests', () => {
  const testManifest = async (stringManifest: string) => {
    const manifest = await RadixEngineToolkit.Instructions.staticallyValidate(
      {
        kind: 'String',
        value: stringManifest,
      },
      RadixNetwork.Ansharnet
    )

    if (manifest.kind === 'Invalid') {
      console.log('Invalid manifest:', stringManifest, manifest.error)
    }

    expect(manifest.kind).toEqual('Valid')
  }

  it('should create pools', () => {
    ;[
      createPoolManifest(
        'package_tdx_d_1pkgxxxxxxxxxplxxxxxxxxxxxxx020379220524xxxxxxxxxa0ecqd',
        'OneResourcePool',
        'resource_tdx_d_1t4efp7jyqd5kk4c3v6atdnenklfymrv3prhqppeg2hpvd3nthwevda'
      ),
      createPoolManifest(
        'package_tdx_d_1pkgxxxxxxxxxplxxxxxxxxxxxxx020379220524xxxxxxxxxa0ecqd',
        'TwoResourcePool',
        'resource_tdx_d_1t4efp7jyqd5kk4c3v6atdnenklfymrv3prhqppeg2hpvd3nthwevda',
        'resource_tdx_d_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxepwmma'
      ),
      createPoolManifest(
        'package_tdx_d_1pkgxxxxxxxxxplxxxxxxxxxxxxx020379220524xxxxxxxxxa0ecqd',
        'MultiResourcePool',
        'resource_tdx_d_1t4efp7jyqd5kk4c3v6atdnenklfymrv3prhqppeg2hpvd3nthwevda',
        'resource_tdx_d_1tks6e8anwle200a78zt2393d9azxppyln3p4508a7j532mlzhu5d4y',
        'resource_tdx_d_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxepwmma'
      ),
    ].reduce(async (prev, manifest) => {
      await prev
      return testManifest(manifest)
    }, Promise.resolve())
  })

  it('should create manifest containing contribution to single resource pool', async () => {
    const stringManifest = contributeToPoolManifest(
      'account_tdx_e_12y3padfwwnj3pv2p2pw8c8tw4cdyedwf655vupahug4cksxhu5hrh5',
      'pool_tdx_e_1cj9uq9evzf52j20zrznh027a7wykmwqjus96vec4jjaylypyay376p',
      [
        {
          amount: '100',
          resourceAddress:
            'resource_tdx_e_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxx8rpsmc',
        },
      ]
    )

    const manifest = await RadixEngineToolkit.Instructions.staticallyValidate(
      {
        kind: 'String',
        value: stringManifest,
      },
      RadixNetwork.RCnetV3
    )

    expect(manifest.kind).toEqual('Valid')
  })

  it('should contribute to pools', () => {
    ;[
      contributeToPoolManifest(
        'account_tdx_d_1289fvg92eldy87sas4j0sqy5jnld4q7lavqhlu9sxf5cjcsj7hyx9u',
        'pool_tdx_d_1chglnrgkkn4uqgfsea7t9h4lzcy9a2agsp5h24vnws0njs4n7ey95q',
        [
          {
            amount: '100',
            resourceAddress:
              'resource_tdx_d_1tks6e8anwle200a78zt2393d9azxppyln3p4508a7j532mlzhu5d4y',
          },
          {
            amount: '200',
            accountToWithdrawFrom:
              'account_tdx_d_1289fvg92eldy87sas4j0sqy5jnld4q7lavqhlu9sxf5cjcsj7hyx9u',
            resourceAddress:
              'resource_tdx_d_1tks6e8anwle200a78zt2393d9azxppyln3p4508a7j532mlzhu5d4y',
          },
        ]
      ),
    ].reduce(async (prev, manifest) => {
      await prev
      return testManifest(manifest)
    }, Promise.resolve())
  })
})
