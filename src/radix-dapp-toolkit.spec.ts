// @ts-nocheck
import { RadixDappToolkit } from './radix-dapp-toolkit'
import { rdtStateDefault } from './io'
import { createLogger } from '@radixdlt/wallet-sdk'
import { Context, MockContext, createMockContext } from './test-helpers/context'
import { subscribeSpyTo } from '@hirez_io/observer-spy'
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
    const metadata = {
      dAppDefinitionAddress:
        'account_tdx_c_1p9c4zhvusrae49fguwm2cuxvltqquzxqex8ddr32e30qjlesen',
      networkId: 12,
      ...params[0],
    } satisfies Parameters<typeof RadixDappToolkit>[0]

    const onConnect =
      params[1] ?? ((() => {}) satisfies Parameters<typeof RadixDappToolkit>[1])

    const options = {
      providers: params[2]?.providers ?? mockProviders,
      logger,
      onInit: onInitSpy,
      onStateChange: onStateChangeSpy,
    } satisfies Parameters<typeof RadixDappToolkit>[2]

    return RadixDappToolkit(metadata, onConnect, options)
  }

  beforeEach(() => {
    onInitSpy.mockReset()
    onStateChangeSpy.mockReset()
    mockProviders = createMockContext()
    providers = mockProviders as unknown as Context
  })

  it('should bootstrap RDT', async () => {
    const rdt = createRdt()

    expect(onInitSpy).toHaveBeenCalledWith(rdtStateDefault)
    expect(onStateChangeSpy).toHaveBeenCalledWith(rdtStateDefault)

    expect(subscribeSpyTo(rdt.state$).getFirstValue()).toEqual(rdtStateDefault)

    await delayAsync(0)

    expect(mockProviders.connectButton.setDappName).toBeCalledWith(
      'Unnamed dApp'
    )
  })
})
