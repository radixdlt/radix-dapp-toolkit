import { SdkError } from '@radixdlt/wallet-sdk/dist/helpers/error'
import { ResultAsync } from 'neverthrow'
import { filter, firstValueFrom, ReplaySubject, Subject } from 'rxjs'
import { Logger } from 'tslog'
import { ConnectButtonClient } from '../connect-button/connect-button-client'
import { InMemoryClient } from '../storage/in-memory-storage-client'
import { RequestItemClient } from '../request-items/request-item-client'
import { StateClient } from '../state/state'
import { State, StorageProvider } from '../_types'
import { ConnectButtonSubjects } from '../connect-button/subjects'
import { WalletClient } from '../wallet/wallet-client'
import { WalletSdk } from '@radixdlt/wallet-sdk'

const WALLET_SUCCESS_RESPONSE = {
  ongoingAccounts: [
    {
      address:
        'account_tdx_b_1qlxj68pketfcx8a6wrrqyvjfzdr7caw08j22gm6d26hq3g6x5m',
      label: 'main',
      appearanceId: 1,
    },
  ],
  persona: {
    identityAddress: 'abc_123',
    label: 'RadMatt',
  },
} as const

const STATE_KEY = `rdt:testDapp:1`

const createMockWalletSdk = () => {
  const sendWalletResponse = new Subject<any>()
  const walletRequestPayload = new Subject<any>()
  return {
    request: (value: any) => {
      walletRequestPayload.next(value)
      return ResultAsync.fromPromise(
        firstValueFrom(sendWalletResponse),
        (error) => error as SdkError
      )
    },
    sendWalletResponse,
    walletRequestPayload,
    destroy: () => {},
  }
}

const logger = new Logger()

let connectButtonSubjects: ConnectButtonSubjects
let connectButtonClient: ConnectButtonClient
let walletClient: WalletClient
let requestItemClient: RequestItemClient
let storageClient: StorageProvider
let stateClient: StateClient
let mockWalletSdk: ReturnType<typeof createMockWalletSdk>

const getRequestItems = async () =>
  firstValueFrom(
    requestItemClient.items$.pipe(filter((items) => items.length > 0))
  )

const waitForLoadingStatus = async (expectedValue: boolean) =>
  firstValueFrom(
    connectButtonSubjects.loading.pipe(
      filter((value) => value === expectedValue)
    )
  )

const waitForConnectedStatus = async (expectedValue: boolean) =>
  await firstValueFrom(
    stateClient.connected$.pipe(
      filter((connected) => connected === expectedValue)
    )
  )

const waitForStateInitialization = async () =>
  firstValueFrom(stateClient.subjects.state$)

const getStoredState = async () => {
  const result = await storageClient.getData<State>(STATE_KEY)

  if (result.isErr()) throw result.error

  const state = result.value!
  return state
}

describe('state management', () => {
  beforeEach(() => {
    connectButtonSubjects = ConnectButtonSubjects()
    connectButtonClient = ConnectButtonClient({
      // logger,
      subjects: connectButtonSubjects,
      dAppName: '',
    })
    requestItemClient = RequestItemClient({
      // logger,
    })
    mockWalletSdk = createMockWalletSdk()
    walletClient = WalletClient({
      walletSdk: mockWalletSdk as unknown as WalletSdk,
      requestItemClient,
      // logger,
    })

    storageClient = InMemoryClient()
  })
  afterEach(() => {
    stateClient.destroy()
  })
  it('should send connect request and receive wallet response', async () => {
    const responseSubject = new ReplaySubject<any>()

    stateClient = StateClient({
      // logger,
      key: STATE_KEY,
      storageClient,
      connectButtonClient,
      walletClient,
      onInitCallback: () => {},
      onDisconnectCallback: () => {},
      connectRequest: (requestData) =>
        requestData({
          accounts: {
            quantifier: 'atLeast',
            quantity: 1,
          },
        }).map(({ data }) => {
          responseSubject.next(data)
          return { data }
        }),
    })

    await waitForStateInitialization()

    // simulate connect action
    connectButtonSubjects.onConnect.next(undefined)

    const [{ id, ...rest }] = await getRequestItems()

    // expect a request item with pending status to be shown in connect button
    expect(rest).toEqual({
      type: 'loginRequest',
      status: 'pending',
    })

    await waitForLoadingStatus(true)

    mockWalletSdk.sendWalletResponse.next(WALLET_SUCCESS_RESPONSE)

    await waitForLoadingStatus(false)

    // expect request item to be shown as successful if a response is returned from wallet
    expect((await getRequestItems())[0].status).toEqual('success')

    await waitForConnectedStatus(true)

    const expectedResponse = {
      accounts: [
        {
          address:
            'account_tdx_b_1qlxj68pketfcx8a6wrrqyvjfzdr7caw08j22gm6d26hq3g6x5m',
          label: 'main',
          appearanceId: 1,
        },
      ],
      persona: {
        identityAddress: 'abc_123',
        label: 'RadMatt',
      },
    }

    expect(await firstValueFrom(responseSubject)).toEqual(expectedResponse)

    const expectedState = {
      ...expectedResponse,
      connected: true,
    }

    expect(await getStoredState()).toEqual(expectedState)
  })

  describe('resolve data requests from state', () => {
    it('should resolve data request from state', async () => {
      const initialState = {
        accounts: [
          {
            address:
              'account_tdx_b_1qlxj68pketfcx8a6wrrqyvjfzdr7caw08j22gm6d26hq3g6x5m',
            label: 'main',
            appearanceId: 1,
          },
        ],
        persona: {
          identityAddress: 'abc_123',
          label: 'RadMatt',
        },
        connected: true,
      }

      await storageClient.setData(STATE_KEY, initialState)

      const init = new ReplaySubject<State>()

      stateClient = StateClient({
        // logger,
        key: STATE_KEY,
        storageClient,
        connectButtonClient,
        walletClient,
        onDisconnectCallback: () => {},
        onInitCallback: (state) => {
          init.next(state)
        },
      })

      await waitForStateInitialization()

      expect(await firstValueFrom(init)).toEqual(initialState)

      const result = await stateClient.requestData({
        accounts: { quantifier: 'exactly', quantity: 1 },
      })

      if (result.isErr()) throw result.error
      expect(result.value).toEqual({
        accounts: [
          {
            address:
              'account_tdx_b_1qlxj68pketfcx8a6wrrqyvjfzdr7caw08j22gm6d26hq3g6x5m',
            label: 'main',
            appearanceId: 1,
          },
        ],
        persona: {
          identityAddress: 'abc_123',
          label: 'RadMatt',
        },
      })

      expect(await firstValueFrom(requestItemClient.items$)).toEqual([])
    })
    it('should send wallet request if data is not available in state', async () => {
      const initialState = {
        accounts: [
          {
            address:
              'account_tdx_b_1qlxj68pketfcx8a6wrrqyvjfzdr7caw08j22gm6d26hq3g6x5m',
            label: 'main',
            appearanceId: 1,
          },
        ],
        persona: {
          identityAddress: 'abc_123',
          label: 'RadMatt',
        },
        connected: true,
      }

      await storageClient.setData(STATE_KEY, initialState)

      const init = new ReplaySubject<State>()

      stateClient = StateClient({
        logger,
        key: STATE_KEY,
        storageClient,
        connectButtonClient,
        walletClient,
        onDisconnectCallback: () => {},
        onInitCallback: (state) => {
          init.next(state)
        },
      })

      await waitForStateInitialization()

      expect(await firstValueFrom(init)).toEqual(initialState)

      stateClient.requestData({
        accounts: { quantifier: 'atLeast', quantity: 2 },
      })

      const [{ id, ...rest }] = await getRequestItems()

      expect(rest).toEqual({
        type: 'dataRequest',
        status: 'pending',
      })
    })
  })

  describe('usePersona', () => {
    it('should send oneTime request without usePersona', async () => {
      const initialState = {
        accounts: [
          {
            address:
              'account_tdx_b_1qlxj68pketfcx8a6wrrqyvjfzdr7caw08j22gm6d26hq3g6x5m',
            label: 'main',
            appearanceId: 1,
          },
        ],
        persona: {
          identityAddress: 'abc_123',
          label: 'RadMatt',
        },
        connected: true,
      }

      await storageClient.setData(STATE_KEY, initialState)

      stateClient = StateClient({
        logger,
        key: STATE_KEY,
        storageClient,
        connectButtonClient,
        walletClient,
        onInitCallback: () => {},
        onDisconnectCallback: () => {},
      })

      await waitForStateInitialization()

      stateClient.requestData({
        accounts: {
          quantifier: 'atLeast',
          quantity: 1,
          oneTime: true,
        },
      })

      const payload = await firstValueFrom(mockWalletSdk.walletRequestPayload)

      expect(payload).toEqual({
        oneTimeAccountsWithoutProofOfOwnership: {
          quantifier: 'atLeast',
          quantity: 1,
        },
      })
    })
  })
})
