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
  <button id="sendTx">Send Tx</button>
  <button id="removeCb">Remove Connect Button</button>
  <button id="addCb">Add Connect Button</button>

  <div class="mt-25"><button id="one-time-request">Send one time request</button></div>

  <pre id="sessions"></pre>
  <pre id="requests"></pre>
  <pre id="state"></pre>
  <pre id="gatewayConfig"></pre>
  <pre id="gatewayStatus"></pre>
  <pre id="device"></pre>
  <pre id="logs"></pre>
`
const resetButton = document.getElementById('reset')!
const sendTxButton = document.getElementById('sendTx')!
const sessions = document.getElementById('sessions')!
const removeCb = document.getElementById('removeCb')!
const addCb = document.getElementById('addCb')!
const requests = document.getElementById('requests')!
const logs = document.getElementById('logs')!
const state = document.getElementById('state')!
const gatewayConfig = document.getElementById('gatewayConfig')!
const gatewayStatus = document.getElementById('gatewayStatus')!
const oneTimeRequest = document.getElementById('one-time-request')!

const logger = Logger()

logger.attachTransport((logObj) => {
  const { _meta, ...rest } = logObj

  const logEntry = `[${_meta.name}]
${JSON.stringify(rest, null, 2)}

${logs.innerHTML}`

  logs.innerHTML = logEntry
})

removeCb.onclick = () => {
  document.querySelector('radix-connect-button')?.remove()
}

addCb.onclick = () => {
  const connectButton = document.createElement('radix-connect-button')
  const header = document.querySelector('header')!
  header.appendChild(connectButton)
}
const dAppToolkit = RadixDappToolkit({
  dAppDefinitionAddress,
  networkId,
  logger,
})

const gatewayApi = GatewayApiClient.initialize(
  dAppToolkit.gatewayApi.clientConfig,
)

dAppToolkit.walletApi.provideChallengeGenerator(async () =>
  generateRolaChallenge(),
)

dAppToolkit.walletApi.setRequestData(
  DataRequestBuilder.persona().withProof(),
  DataRequestBuilder.accounts().atLeast(1),
)

gatewayConfig.innerHTML = `
[Gateway]
${JSON.stringify(dAppToolkit.gatewayApi.clientConfig, null, 2)}`

resetButton.onclick = () => {
  sessionStore.clear()
  requestsStore.clear()
  stateStore.clear()
  identityStore.clear()
  localStorage.removeItem('logs')
  window.location.hash = ``
  window.location.replace(window.location.origin)
}

sendTxButton.onclick = () => {
  dAppToolkit.walletApi.sendTransaction({
    transactionManifest: `
    CALL_METHOD
      Address("component_tdx_2_1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxyulkzl")
      "free"
    ;
    
    CALL_METHOD
      Address("account_tdx_2_1299trm47s3x648jemhu3lfm4d6gt73289rd9s2hpdjm3tp5pdwq4m5")
      "try_deposit_batch_or_abort"
      Expression("ENTIRE_WORKTOP")
      Enum<0u8>()
    ;`,
  })
}

oneTimeRequest.onclick = () => {
  dAppToolkit.walletApi.sendOneTimeRequest(
    OneTimeDataRequestBuilder.accounts().exactly(1),
  )
}

setInterval(() => {
  requestsStore.getState().map((value: any) => {
    requests.innerHTML = JSON.stringify({ requests: value ?? {} }, null, 2)
  })
  stateStore.getState().map((value: any) => {
    state.innerHTML = JSON.stringify({ state: value ?? {} }, null, 2)
  })
  sessionStore.getItemList().map((value: any) => {
    sessions.innerHTML = JSON.stringify({ sessions: value }, null, 2)
  })
}, 1000)
