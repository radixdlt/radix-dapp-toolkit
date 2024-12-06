import { describe, expect, it, vi } from 'vitest'
import { WalletRequestModule } from './wallet-request'
import { RadixNetwork, TransactionStatus } from '../gateway'
import { LocalStorageModule } from '../storage'
import { ok, okAsync, ResultAsync } from 'neverthrow'
import {
  WalletInteractionFailureResponse,
  WalletInteractionItems,
} from '../../schemas'
import {
  failedResponseResolver,
  RequestResolverModule,
  sendTransactionResponseResolver,
} from './request-resolver'
import { RequestItemModule } from './request-items'
import { delayAsync } from '../../test-helpers/delay-async'
import { WalletRequestSdk } from './wallet-request-sdk'
import { TransportProvider } from '../../_types'
import { TestingTransportModule } from './transport/testing-transport/transport.testing-module'

const createMockEnvironment = () => {
  const storageModule = LocalStorageModule(`rdt:${crypto.randomUUID()}:1`)
  const gatewayModule = {
    pollTransactionStatus: (hash: string) =>
      ResultAsync.fromSafePromise(delayAsync(2000)).map(() =>
        ok({ status: 'success' as TransactionStatus }),
      ),
  } as any
  const requestItemModule = RequestItemModule({
    providers: {
      gatewayModule,
      storageModule,
    },
  })

  const updateConnectButtonStatus = () => {}
  return {
    storageModule,
    requestItemModule,
    gatewayModule,
    updateConnectButtonStatus,
  }
}

describe('WalletRequestModule', () => {
  describe('given `onTransactionId` callback is provided', () => {
    it('should call the callback before polling is finished', async () => {
      // Arange
      const {
        storageModule,
        requestItemModule,
        gatewayModule,
        updateConnectButtonStatus,
      } = createMockEnvironment()

      const requestResolverModule = RequestResolverModule({
        providers: {
          storageModule,
          requestItemModule,
          resolvers: [
            sendTransactionResponseResolver({
              gatewayModule,
              requestItemModule,
              updateConnectButtonStatus,
            }),
          ],
        },
      })

      const interactionId = 'abcdef'
      const resultReturned = vi.fn()
      const onTransactionIdSpy = vi.fn()

      const walletRequestModule = WalletRequestModule({
        useCache: false,
        networkId: RadixNetwork.Stokenet,
        dAppDefinitionAddress: '',
        providers: {
          stateModule: {} as any,
          storageModule,
          requestItemModule,
          requestResolverModule,
          gatewayModule,
          walletRequestSdk: {
            sendInteraction: () => okAsync({}),
            createWalletInteraction: (items: WalletInteractionItems) => ({
              items,
              interactionId,
              metadata: {} as any,
            }),
          } as any,
        },
      })

      // Act
      walletRequestModule
        .sendTransaction({
          transactionManifest: ``,
          onTransactionId: onTransactionIdSpy,
        })
        .map(resultReturned)

      await delayAsync(50)

      requestResolverModule.addWalletResponses([
        {
          interactionId,
          discriminator: 'success',
          items: {
            discriminator: 'transaction',
            send: {
              transactionIntentHash: 'intent_hash',
            },
          },
        },
      ])

      // Assert
      expect(resultReturned).not.toHaveBeenCalled()
      await expect
        .poll(() => onTransactionIdSpy, {
          timeout: 1000,
        })
        .toHaveBeenCalledWith('intent_hash')
      await expect
        .poll(() => resultReturned, {
          timeout: 3000,
        })
        .toHaveBeenCalledWith(
          expect.objectContaining({ transactionIntentHash: 'intent_hash' }),
        )
    })
  })

  describe('GIVEN wallet responds with discriminator "failure"', () => {
    it('should return error result', async () => {
      // Arange
      const {
        storageModule,
        requestItemModule,
        gatewayModule,
        updateConnectButtonStatus,
      } = createMockEnvironment()

      const requestResolverModule = RequestResolverModule({
        providers: {
          storageModule,
          requestItemModule,
          resolvers: [
            failedResponseResolver({
              requestItemModule,
              updateConnectButtonStatus,
            }),
          ],
        },
      })

      const interactionId = '8cefec84-542d-40af-8782-b89df05db8ac'

      const testingTransport = TestingTransportModule({ requestResolverModule })
      testingTransport.setNextWalletResponse({
        discriminator: 'failure',
        interactionId: '8cefec84-542d-40af-8782-b89df05db8ac',
        error: 'rejectedByUser',
      })

      const walletRequestModule = WalletRequestModule({
        useCache: false,
        networkId: RadixNetwork.Stokenet,
        dAppDefinitionAddress: '',
        providers: {
          stateModule: {} as any,
          storageModule,
          requestItemModule,
          requestResolverModule,
          gatewayModule,
          walletRequestSdk: WalletRequestSdk({
            networkId: 2,
            dAppDefinitionAddress: '',
            providers: {
              interactionIdFactory: () => interactionId,
              transports: [testingTransport],
            },
          }),
        },
      })

      // Act
      const result = await walletRequestModule.sendTransaction({
        transactionManifest: ``,
      })

      // Assert
      expect(result.isErr() && result.error).toEqual(
        expect.objectContaining({
          discriminator: 'failure',
          error: 'rejectedByUser',
        }),
      )
    })
  })
})
