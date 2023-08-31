import {
  deriveVirtualEcdsaSecp256k1AccountAddress,
  deriveVirtualEddsaEd25519AccountAddress,
  deriveVirtualIdentityAddress,
} from './derive-address-from-public-key'
import { RadixNetwork } from '@radixdlt/babylon-gateway-api-sdk'

describe('deriveAddressFromPublicKey', () => {
  it('should derive virtual identity address', async () => {
    const output = deriveVirtualIdentityAddress(
      '59c02cc1c4cc1eddd90907bb848c44ac1808d844476c1621ecf234cf3ed49c57',
      RadixNetwork.Enkinet
    )

    const result = await output.unwrapOr(undefined)
    expect(result).toEqual(
      'identity_tdx_21_12t5uwv48e5j7w368r7kjmcrw3wygfh0dtssz0u5n4hkq7qawrwrzyv'
    )
  })

  it('should derive ed25519 virtual account address', async () => {
    const output = deriveVirtualEddsaEd25519AccountAddress(
      '59c02cc1c4cc1eddd90907bb848c44ac1808d844476c1621ecf234cf3ed49c57',
      RadixNetwork.Enkinet
    )

    const result = await output.unwrapOr(undefined)
    expect(result).toEqual(
      'account_tdx_21_1285uwv48e5j7w368r7kjmcrw3wygfh0dtssz0u5n4hkq7qawthf4kn'
    )
  })

  it('should derive secp256k1 virtual account address', async () => {
    const output = deriveVirtualEcdsaSecp256k1AccountAddress(
      '02807797adba8d61024c186f438b7bd9c7e1260b6306d615c35faeef9da052e5e4',
      RadixNetwork.Enkinet
    )

    const result = await output.unwrapOr(undefined)
    expect(result).toEqual(
      'account_tdx_21_168razfxd603n87nals6us3nnzet2k9tjdk5dlyh2xdjkah3duuyyr3'
    )
  })
})
