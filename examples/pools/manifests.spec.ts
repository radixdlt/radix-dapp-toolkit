import { RadixNetwork } from '@radixdlt/babylon-gateway-api-sdk'
import { RadixEngineToolkit } from '@radixdlt/radix-engine-toolkit'
import { contributeToPoolManifest, createPoolManifest } from './manifests'

describe('pools manifests', () => {
  const testManifest = async (stringManifest: string) => {
    const manifest = RadixEngineToolkit.Instructions.staticallyValidate(
      {
        kind: 'String',
        value: stringManifest,
      },
      RadixNetwork.Ansharnet
    )

    await expect(manifest).resolves.toBeDefined()
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
    ].forEach((manifest) => testManifest(manifest))
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
        ]
      ),
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
    ].forEach((manifest) => testManifest(manifest))
  })
})
