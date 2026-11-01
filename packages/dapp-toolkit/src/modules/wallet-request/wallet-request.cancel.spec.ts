import { describe, expect, it } from 'vitest'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { WalletRequestModule } from './wallet-request'
import { RadixNetwork } from '../gateway'
import { LocalStorageModule } from '../storage'
import { RequestResolverModule } from './request-resolver'
import { RequestItemModule } from './request-items'
import { WalletRequestSdk } from './wallet-request-sdk'
import { EnvironmentModule } from '../environment'
import { SdkError } from '../../error'
import type { TransportProvider } from '../../_types'
import type {
  WalletInteraction,
  WalletInteractionResponse,
} from '../../schemas'

/**
 * A transport whose wallet never answers: a request stays pending until it is cancelled, and
 * every cancellation the transport is asked to send to the wallet is recorded.
 */
const WaitingTransport = () => {
  const cancelled: string[] = []
  const transport: TransportProvider = {
    id: 'WaitingTransport',
    isSupported: () => true,
    disconnect: () => {},
    destroy: () => {},
    send: (walletInteraction: WalletInteraction, callbackFns) => {
      let settle: (error: SdkError) => void = () => {}
      const answered = new Promise<SdkError>((resolve) => {
        settle = resolve
      })
      callbackFns.requestControl?.({
        getRequest: () => walletInteraction,
        cancelRequest: () => {
          cancelled.push(walletInteraction.interactionId)
          settle(SdkError('canceledByUser', walletInteraction.interactionId))
          return okAsync('requestCancelSuccess' as const)
        },
      })
      return ResultAsync.fromSafePromise(answered).andThen((error) =>
        errAsync<WalletInteractionResponse, SdkError>(error),
      )
    },
  }
  return { transport, cancelled }
}

const setUp = () => {
  const environmentModule = EnvironmentModule()
  const storageModule = LocalStorageModule(`rdt:${crypto.randomUUID()}:2`, {
    providers: { environmentModule },
  })
  const gatewayModule = {} as any
  const requestItemModule = RequestItemModule({
    providers: { gatewayModule, storageModule },
  })
  const requestResolverModule = RequestResolverModule({
    providers: { storageModule, requestItemModule, resolvers: [] },
  })
  const { transport, cancelled } = WaitingTransport()
  let interactions = 0
  const walletRequestModule = WalletRequestModule({
    useCache: false,
    networkId: RadixNetwork.Stokenet,
    dAppDefinitionAddress: '',
    providers: {
      stateModule: { reset: () => {} } as any,
      storageModule,
      requestItemModule,
      requestResolverModule,
      environmentModule,
      gatewayModule,
      walletRequestSdk: WalletRequestSdk({
        networkId: 2,
        dAppDefinitionAddress: '',
        providers: {
          environmentModule,
          interactionIdFactory: () => `interaction-${++interactions}`,
          transports: [transport],
        },
      }),
    },
  })
  return { walletRequestModule, cancelled }
}

/** Lets the request reach the transport before the test acts on it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 50))

describe('WalletRequestModule cancelling', () => {
  describe('GIVEN a request is waiting in the wallet', () => {
    it('disconnect tells the wallet the request is cancelled', async () => {
      const { walletRequestModule, cancelled } = setUp()
      const request = walletRequestModule.sendTransaction({
        transactionManifest: '',
      })
      await settled()

      walletRequestModule.disconnect()
      const result = await request

      expect(cancelled).toEqual(['interaction-1'])
      expect(result.isErr() && result.error.error).toBe('canceledByUser')
    })

    it('cancelPendingRequests cancels it in the wallet, without disconnecting', async () => {
      const { walletRequestModule, cancelled } = setUp()
      const request = walletRequestModule.sendTransaction({
        transactionManifest: '',
      })
      await settled()

      await walletRequestModule.cancelPendingRequests()
      const result = await request

      expect(cancelled).toEqual(['interaction-1'])
      expect(result.isErr() && result.error.error).toBe('canceledByUser')
    })
  })

  describe('GIVEN nothing is waiting', () => {
    it('cancelPendingRequests tells the wallet nothing', async () => {
      const { walletRequestModule, cancelled } = setUp()

      const result = await walletRequestModule.cancelPendingRequests()

      expect(result.isOk()).toBe(true)
      expect(cancelled).toEqual([])
    })
  })
})
