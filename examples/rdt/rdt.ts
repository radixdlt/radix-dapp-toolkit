import { BehaviorSubject } from 'rxjs'
import { RadixDappToolkit } from '../../src/radix-dapp-toolkit'
import { getRequestDataPayload } from '../data-request/state'
import { appLogger } from '../logger/state'
import {
  bootstrapNetwork,
  networkId as networkIdSubject,
} from '../network/state'
import { createObservableHook } from '../helpers/create-observable-hook'
import { setAccounts } from '../account/state'
import { addEntities } from '../entity/state'

const networkId = networkIdSubject.value

const getDAppDefinitionFromLocalStorage = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem('dAppDefinitionAddress')
    if (!raw) {
      appLogger.debug('No dAppDefinitionAddress found in localStorage, defaulting')
      return {
        '12': 'account_tdx_c_1pysl6ft839lj0murylf2vsmn57e67v20px435v37tejqv0famt',
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

const metaData = {
  dAppDefinitionAddress: dAppDefinitionAddress.value,
  networkId,
}

const options: Parameters<typeof RadixDappToolkit>[2] = {
  logger: appLogger as any,
  onStateChange: (state) => {
    setAccounts(state.walletData.accounts || [])
    if (state.walletData.persona)
      addEntities([
        {
          address: state.walletData.persona?.identityAddress,
          type: 'identity',
        },
      ])
  },
  onInit: () => {
    bootstrapNetwork(networkId)
    setTimeout(() => {
      appLogger.debug('RDT initialized with', { metaData, options })
    })
  },
  useCache: false,
}

export const rdt = RadixDappToolkit(
  metaData,
  (requestData) => {
    getRequestDataPayload().andThen(requestData)
  },
  options
)
