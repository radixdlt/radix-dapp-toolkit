import { RadixDappToolkit } from './radix-dapp-toolkit'
import { describe, it } from 'vitest'

describe('RadixDappToolkit', () => {
  it('should bootstrap RDT', async () => {
    RadixDappToolkit({
      dAppDefinitionAddress:
        'account_tdx_c_1p9c4zhvusrae49fguwm2cuxvltqquzxqex8ddr32e30qjlesen',
      networkId: 2,
    })
  })
})
