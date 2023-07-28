import { BehaviorSubject } from 'rxjs'
import {
  DataRequestBuilder,
  DataRequestStateClient,
  OneTimeDataRequestBuilder,
  RadixDappToolkit,
} from '../../src'
import { appLogger } from '../logger/state'
import {
  bootstrapNetwork,
  networkId as networkIdSubject,
} from '../network/state'
import { createObservableHook } from '../helpers/create-observable-hook'
import { setAccounts } from '../account/state'
import { addEntities } from '../entity/state'
import { createChallenge } from '../helpers/create-challenge'
import { GatewayApiClient } from '../../src/gateway/gateway-api'
import { GatewayClient } from '../../src/gateway/gateway'
import {
  RadixNetwork,
  RadixNetworkConfigById,
} from '@radixdlt/babylon-gateway-api-sdk'

const networkId = networkIdSubject.value

const getDAppDefinitionFromLocalStorage = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem('dAppDefinitionAddress')
    if (!raw) {
      appLogger.debug(
        'No dAppDefinitionAddress found in localStorage, defaulting'
      )
      return {
        [RadixNetwork.Kisharnet]:
          'account_tdx_c_1pysl6ft839lj0murylf2vsmn57e67v20px435v37tejqv0famt',
        [RadixNetwork.Ansharnet]:
          'account_tdx_d_16996e320lnez82q6430eunaz9l3n5fnwk6eh9avrmtmj22e7m9lvl2',
        [RadixNetwork.Hammunet]:
          'account_tdx_22_12xt9uxe39dxdfy9c23vn0qj7eaxs8p3fjjpkr8f48edsfvyk00ck3l',
      }
    }

    const parsed = JSON.parse(raw)
    return parsed
  } catch (error) {
    return {}
  }
}

const getDAppDefinitionAddressDefault = () =>
  getDAppDefinitionFromLocalStorage()[networkId] || ''

export const dAppDefinitionAddress = new BehaviorSubject<string>(
  getDAppDefinitionAddressDefault()
)

export const setDAppDefinitionAddress = (value: string) => {
  const currentData = getDAppDefinitionFromLocalStorage()
  localStorage.setItem(
    'dAppDefinitionAddress',
    JSON.stringify({ ...currentData, [networkId]: value })
  )
  location.reload()
}

export const useDAppDefinitionAddress = createObservableHook(
  dAppDefinitionAddress,
  getDAppDefinitionAddressDefault()
)

bootstrapNetwork(networkId)

export const gatewayApi = GatewayApiClient({
  basePath: RadixNetworkConfigById[networkId].gatewayUrl,
})

export const dataRequestStateClient = DataRequestStateClient({})

const options = {
  dAppDefinitionAddress: dAppDefinitionAddress.value,
  networkId,
  logger: appLogger as any,
  providers: {
    gatewayClient: GatewayClient({ gatewayApi }),
    dataRequestStateClient,
  },
  useCache: false,
}

setTimeout(() => {
  appLogger.debug('RDT initialized with', options)
}, 1000)

export const rdt = RadixDappToolkit(options)

rdt.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1))

rdt.walletApi.walletData$.subscribe((state) => {
  setAccounts(state.accounts)
  if (state.persona)
    addEntities([
      {
        address: state.persona?.identityAddress,
        type: 'identity',
      },
    ])
})

rdt.walletApi.provideChallengeGenerator(async () => createChallenge())

rdt.walletApi.setRequestData(
  DataRequestBuilder.config({
    personaData: { fullName: true },
    accounts: { numberOfAccounts: { quantifier: 'atLeast', quantity: 1 } },
  })
)
