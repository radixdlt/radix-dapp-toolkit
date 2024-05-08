import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk'
import './style.css'
import {
  RadixDappToolkit,
  RadixNetwork,
  Logger,
  DataRequestBuilder,
  OneTimeDataRequestBuilder,
  LocalStorageModule,
  generateRolaChallenge,
} from '@radixdlt/radix-dapp-toolkit'

const dAppDefinitionAddress = import.meta.env.VITE_DAPP_DEFINITION_ADDRESS
const networkId = RadixNetwork.Stokenet
const storageModule = LocalStorageModule(
  `rdt:${dAppDefinitionAddress}:${networkId}`,
)
const requestsStore = storageModule.getPartition('requests')
const sessionStore = storageModule.getPartition('sessions')
const identityStore = storageModule.getPartition('identities')
const stateStore = storageModule.getPartition('state')

const content = document.getElementById('app')!

content.innerHTML = `  
  <button id="reset">Reset</button>
  <div class="mt-25"><button id="one-time-request">Send one time request</button></div>
  <pre id="logs"></pre>
`
const resetButton = document.getElementById('reset')!
const oneTimeRequest = document.getElementById('one-time-request')!
const sessions = document.getElementById('sessions')!
const requests = document.getElementById('requests')!
const logs = document.getElementById('logs')!
const state = document.getElementById('state')!
const gatewayStatus = document.getElementById('gatewayStatus')!

const logger = Logger()

logger.attachTransport((logObj) => {
  const { _meta, ...rest } = logObj

  const logEntry = `[${_meta.name}]
${JSON.stringify(rest, null, 2)}  

${logs.innerHTML}`

  localStorage.setItem('logs', logEntry)

  logs.innerHTML = logEntry
})

const dAppToolkit = RadixDappToolkit({
  dAppDefinitionAddress,
  networkId,
  featureFlags: ['ExperimentalMobileSupport'],
  logger,
})

const gatewayApi = GatewayApiClient.initialize(
  dAppToolkit.gatewayApi.clientConfig,
)

dAppToolkit.walletApi.provideChallengeGenerator(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return generateRolaChallenge()
})

dAppToolkit.walletApi.setRequestData(DataRequestBuilder.persona().withProof())

resetButton.onclick = () => {
  sessionStore.clear()
  requestsStore.clear()
  stateStore.clear()
  identityStore.clear()
  localStorage.removeItem('logs')
  window.location.hash = ``
  window.location.replace(window.location.origin)
}

oneTimeRequest.onclick = () => {
  dAppToolkit.walletApi.sendOneTimeRequest(
    OneTimeDataRequestBuilder.accounts().exactly(1),
  )
}
