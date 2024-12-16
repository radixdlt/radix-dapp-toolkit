import { describe, expect, it, vi } from 'vitest'
import { WalletRequestModule } from './wallet-request'
import { RadixNetwork, TransactionStatus } from '../gateway'
import { LocalStorageModule } from '../storage'
import { ok, okAsync, ResultAsync } from 'neverthrow'
import { WalletInteractionItems } from '../../schemas'
import {
  failedResponseResolver,
  preAuthorizationResponseResolver,
  RequestResolverModule,
  sendTransactionResponseResolver,
} from './request-resolver'
import { RequestItemModule } from './request-items'
import { delayAsync } from '../../test-helpers/delay-async'
import { WalletRequestSdk } from './wallet-request-sdk'
import { TestingTransportModule } from './transport/testing-transport/transport.testing-module'
import { EnvironmentModule } from '../environment'
import { SubintentRequestBuilder } from './pre-authorization-request'

const createMockEnvironment = () => {
  const storageModule = LocalStorageModule(`rdt:${crypto.randomUUID()}:1`, {
    providers: {
      environmentModule: EnvironmentModule(),
    },
  })
  const gatewayModule = {
    pollTransactionStatus: (hash: string) =>
      ResultAsync.fromSafePromise(delayAsync(2000)).map(() =>
        ok({ status: 'success' as TransactionStatus }),
      ),

    pollSubintentStatus: () => {
      return {
        stop: () => undefined,
        result: ResultAsync.fromSafePromise(delayAsync(100)).map(() => ({
          subintentStatus: 'CommittedSuccess' as TransactionStatus,
          transactionIntentHash: 'transactionIntentHash',
        })),
      }
    },
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
          environmentModule: EnvironmentModule(),
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
          environmentModule: EnvironmentModule(),
          gatewayModule,
          walletRequestSdk: WalletRequestSdk({
            networkId: 2,
            dAppDefinitionAddress: '',
            providers: {
              environmentModule: EnvironmentModule(),
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

  describe('GIVEN subintent is submitted to the network', () => {
    describe('AND onSubmittedSuccess callback is provided', () => {
      it('should call the callback with transaction intent hash', async () => {
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
              preAuthorizationResponseResolver({
                requestItemModule,
                updateConnectButtonStatus,
              }),
            ],
          },
        })

        const interactionId = '8cefec84'

        const testingTransport = TestingTransportModule({
          requestResolverModule,
        })
        testingTransport.setNextWalletResponse({
          discriminator: 'success',
          items: {
            discriminator: 'preAuthorizationResponse',
            response: {
              subintentHash:
                'subtxid_tdx_2_17nhcfn9njxlrvgl8afk5dwcaj2peydrtzty0rppdm5dqnwqxs6sq0u59fe',
              expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
              signedPartialTransaction:
                '4d220e03210221012105210607020a32ef0000000000000a40ef00000000000022000',
            },
          },
          interactionId,
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
            environmentModule: EnvironmentModule(),
            gatewayModule,
            walletRequestSdk: WalletRequestSdk({
              networkId: 2,
              dAppDefinitionAddress: '',
              providers: {
                environmentModule: EnvironmentModule(),
                interactionIdFactory: () => interactionId,
                transports: [testingTransport],
              },
            }),
          },
        })

        const onSubmittedSpy = vi.fn()
        // Act
        const result = await walletRequestModule.sendPreAuthorizationRequest(
          SubintentRequestBuilder()
            .manifest(``)
            .setExpiration('afterDelay', 4600)
            .onSubmittedSuccess((a) => {
              console.log('onSubmittedSuccess', a)
              onSubmittedSpy(a)
            }),
        )

        await delayAsync(2000)

        // Assert

        expect(onSubmittedSpy).toHaveBeenCalledWith('transactionIntentHash')
        expect(result.isOk() && result.value).toEqual(
          expect.objectContaining({
            signedPartialTransaction:
              '4d220e03210221012105210607020a32ef0000000000000a40ef00000000000022000',
            subintentHash:
              'subtxid_tdx_2_17nhcfn9njxlrvgl8afk5dwcaj2peydrtzty0rppdm5dqnwqxs6sq0u59fe',
          }),
        )
      })
    })
  })
})
