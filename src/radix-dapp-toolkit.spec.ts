// @ts-nocheck
import { RadixDappToolkit } from './radix-dapp-toolkit'
import { createLogger } from '@radixdlt/wallet-sdk'
import { Context, MockContext, createMockContext } from './test-helpers/context'
import { delayAsync } from './test-helpers/delay-async'

let onInitSpy = jest.fn()
let onStateChangeSpy = jest.fn()
let mockProviders: MockContext
let providers: Context
const logger = createLogger(2)

describe('RadixDappToolkit', () => {
  const createRdt = (
    ...params: Partial<Parameters<typeof RadixDappToolkit>>
  ) => {
    const options = {
      dAppDefinitionAddress:
        'account_tdx_c_1p9c4zhvusrae49fguwm2cuxvltqquzxqex8ddr32e30qjlesen',
      networkId: 12,
      providers: params[0]?.providers ?? mockProviders,
      logger,
    } satisfies Parameters<typeof RadixDappToolkit>[0]

    return RadixDappToolkit(options)
  }

  beforeEach(() => {
    onInitSpy.mockReset()
    onStateChangeSpy.mockReset()
    mockProviders = createMockContext()
    providers = mockProviders as unknown as Context
  })

  it('should bootstrap RDT', async () => {
    const rdt = createRdt()

    await delayAsync(0)

    expect(mockProviders.connectButton.setDappName).toBeCalledWith(
      'Unnamed dApp'
    )
  })

  it('should emit stateEntityDetails response', async () => {
    const rdt = createRdt()
    const spy = jest.fn()
    rdt.dAppDefinitionAccount.entityDetails$.subscribe(spy)

    await delayAsync(0)

    expect(spy).toHaveBeenCalledWith({
      address: 'test',
      metadata: {
        items: [],
      },
    })
  })

  it('should set dAppDefinitionAccount.entityDetails ', async () => {
    const rdt = createRdt()

    expect(rdt.dAppDefinitionAccount.entityDetails).toBe(undefined)
    await delayAsync(0)
    expect(rdt.dAppDefinitionAccount.entityDetails).toEqual({
      address: 'test',
      metadata: {
        items: [],
      },
    })
  })
})
