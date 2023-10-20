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
      RadixNetwork.Stokenet
    )

    if (manifest.kind === 'Invalid') {
      console.log('Invalid manifest:', stringManifest, manifest.error)
    }

    expect(manifest.kind).toEqual('Valid')
  }

  it('should create pools', () => {
    ;;[
      createPoolManifest(
        'package_tdx_2_1pkgxxxxxxxxxplxxxxxxxxxxxxx020379220524xxxxxxxxxe4r780',
        'OneResourcePool',
        'resource_tdx_2_1t5h2mngzd20822qf4crt76pc52ms5ml4534va9cs7ddqagna7ye6jt'
      ),
      createPoolManifest(
        'package_tdx_2_1pkgxxxxxxxxxplxxxxxxxxxxxxx020379220524xxxxxxxxxe4r780',
        'TwoResourcePool',
        'resource_tdx_2_1t5h2mngzd20822qf4crt76pc52ms5ml4534va9cs7ddqagna7ye6jt',
        'resource_tdx_2_1thfqzpm8rnf9c9c45n9t56h0h9lnr6d4d3htpp2j0clf7gek4v8ugw'
      ),
      createPoolManifest(
        'package_tdx_2_1pkgxxxxxxxxxplxxxxxxxxxxxxx020379220524xxxxxxxxxe4r780',
        'MultiResourcePool',
        'resource_tdx_2_1t5h2mngzd20822qf4crt76pc52ms5ml4534va9cs7ddqagna7ye6jt',
        'resource_tdx_2_1thfqzpm8rnf9c9c45n9t56h0h9lnr6d4d3htpp2j0clf7gek4v8ugw',
        'resource_tdx_2_1thr2u25j2fw45lfrttrsawvwu0m5cdm0y2qtkr2nzd45m296wz4fke'
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
        'account_tdx_2_168qgdkgfqxpnswu38wy6fy5v0q0um52zd0umuely5t9xrf88x4wqmf',
        'pool_tdx_2_1c5mplf9rxrht4rm9pq2dx3euqh4glccgfq6wldynl6t4ryjzg680pe',
        [
          {
            amount: '100',
            resourceAddress:
              'resource_tdx_2_1thr2u25j2fw45lfrttrsawvwu0m5cdm0y2qtkr2nzd45m296wz4fke',
          },
          {
            amount: '200',
            accountToWithdrawFrom:
              'account_tdx_2_12yvp2f66agxcqpe6l26cavhkvuel9x4l6cezc8k3exq6a6vh4ty3hq',
            resourceAddress:
              'resource_tdx_2_1t45j74dexzlu6ugnm8eask498c47pmxlj4sptrrv7ve0re0tnlrgac',
          },
        ]
      ),
    ].reduce(async (prev, manifest) => {
      await prev
      return testManifest(manifest)
    }, Promise.resolve())
  })
})
