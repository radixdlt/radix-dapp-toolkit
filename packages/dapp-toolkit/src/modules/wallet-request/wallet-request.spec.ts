import { Logger } from './../../helpers/logger'
import { describe, expect, it, vi } from 'vitest'
import { WalletRequestModule } from './wallet-request'
import { GatewayModule, RadixNetwork, TransactionStatus } from '../gateway'
import { LocalStorageModule } from '../storage'
import { ok, okAsync, ResultAsync } from 'neverthrow'
import { WalletInteractionItems } from '../../schemas'
import {
  RequestResolverModule,
  sendTransactionResponseResolver,
} from './request-resolver'
import { RequestItemModule } from './request-items'
import { delayAsync } from '../../test-helpers/delay-async'

const createMockEnvironment = () => {
  const storageModule = LocalStorageModule(`rdt:${crypto.randomUUID()}:1`)
  const requestItemModule = RequestItemModule({
    providers: {
      storageModule,
    },
  })
  const gatewayModule = {
    pollTransactionStatus: (hash: string) =>
      ResultAsync.fromSafePromise(delayAsync(2000)).map(() =>
        ok({ status: 'success' as TransactionStatus }),
      ),
  } as any
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
})
