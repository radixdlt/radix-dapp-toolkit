import './style.css'
import {
  RadixDappToolkit,
  RadixNetwork,
  LocalStorageClient,
  Logger,
  RequestItemClient,
  ConnectorExtensionClient,
  DataRequestBuilder,
  RadixConnectRelayClient,
  OneTimeDataRequestBuilder,
} from '@radixdlt/radix-dapp-toolkit'

const dAppDefinitionAddress = import.meta.env.VITE_DAPP_DEFINITION_ADDRESS
const networkId = RadixNetwork.Stokenet
const storageClient = LocalStorageClient(
  `rdt:${dAppDefinitionAddress}:${networkId}`,
)
const requestsStore = storageClient.getPartition('requests')
const sessionStore = storageClient.getPartition('sessions')
const identityStore = storageClient.getPartition('identities')
const stateStore = storageClient.getPartition('state')

const content = document.getElementById('app')!

content.innerHTML = `
  <button id="continue">Continue login request</button>
  
  <button id="reset">Reset</button>

  <div class="mt-25"><button id="one-time-request">Send one time request</button></div>

  <pre id="sessions"></pre>
  <pre id="keyPairs"></pre>
  <pre id="walletResponse"></pre>
  <pre id="requests"></pre>
  <pre id="state"></pre>
  <pre id="device"></pre>
  <pre id="logs"></pre>
`
const resetButton = document.getElementById('reset')!
const sessions = document.getElementById('sessions')!
const keyPairs = document.getElementById('keyPairs')!
const requests = document.getElementById('requests')!
const walletResponse = document.getElementById('walletResponse')!
const device = document.getElementById('device')!
const logs = document.getElementById('logs')!
const state = document.getElementById('state')!
const continueButton = document.getElementById('continue')!
const oneTimeRequest = document.getElementById('one-time-request')!

const logger = Logger()

logger.attachTransport((logObj) => {
  const { _meta, ...rest } = logObj
  logs.innerHTML = `${logs.innerHTML}

[${_meta.name}]
${JSON.stringify(rest, null, 2)}`
})

const requestItemClient = RequestItemClient({
  logger,
  providers: { storageClient: storageClient.getPartition('requests') },
})

const rcr = RadixConnectRelayClient({
  logger,
  walletUrl: 'https://d1rxdfxrfmemlj.cloudfront.net',
  baseUrl: 'https://radix-connect-relay-dev.rdx-works-main.extratools.works',
  providers: {
    requestItemClient,
    storageClient,
  },
})

const dAppToolkit = RadixDappToolkit({
  dAppDefinitionAddress,
  networkId,
  enableMobile: true,
  providers: {
    storageClient,
    requestItemClient,
    transports: [
      ConnectorExtensionClient({ logger, providers: { requestItemClient } }),
      RadixConnectRelayClient({
        logger,
        walletUrl: 'https://d1rxdfxrfmemlj.cloudfront.net',
        baseUrl:
          'https://radix-connect-relay-dev.rdx-works-main.extratools.works',
        providers: {
          requestItemClient,
          storageClient,
        },
      }),
    ],
  },
  logger,
})

dAppToolkit.walletApi.provideChallengeGenerator(async () =>
  [...window.crypto.getRandomValues(new Uint8Array(32))]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join(''),
)

dAppToolkit.walletApi.setRequestData(DataRequestBuilder.persona().withProof())

resetButton.onclick = () => {
  sessionStore.clear()
  requestsStore.clear()
  stateStore.clear()
  identityStore.clear()
  window.location.hash = ``
  window.location.replace(window.location.origin)
}

continueButton.onclick = () => {
  requestItemClient.getPendingItems().map((items) => {
    if (items[0]) rcr.resume(items[0].interactionId)
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
  // storageClient.getPartition('identities')
  // .getState((state) => {
  //   keyPairs.innerHTML = JSON.stringify(state, null, 2)
  //   debugger
  // })
  // .map((items) => {
  //   keyPairs.innerHTML = JSON.stringify(items, null, 2)
  // })
  // storageClient
  //   .getData<
  //     Record<string, { createdAt: number; status: string }>
  //   >(`rdt:${dAppDefinitionAddress}:${networkId}:sessions`)
  //   .map((items) => {
  //     sessions.innerHTML = JSON.stringify({ sessions: items }, null, 2)
  //   })
  // const url = new URL(window.location.href)
  // const entries = Object.fromEntries([...url.searchParams.entries()])
  // walletResponse.innerHTML = JSON.stringify({ walletResponse: entries }, null, 2)
  // device.innerHTML = JSON.stringify(
  //   { device: navigator.userAgent, isAndroid: navigator.userAgent.includes('Android') },
  //   null,
  //   2
  // )
}, 1000)
