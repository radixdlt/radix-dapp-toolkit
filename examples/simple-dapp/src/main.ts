import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk'
import './style.css'
import {
  RadixDappToolkit,
  RadixNetwork,
  Logger,
  DataRequestBuilder,
  OneTimeDataRequestBuilder,
  LocalStorageModule,
  EnvironmentModule,
  generateRolaChallenge,
  SubintentRequestBuilder,
} from '@radixdlt/radix-dapp-toolkit'

const dAppDefinitionAddress = import.meta.env.VITE_DAPP_DEFINITION_ADDRESS
const networkId = RadixNetwork.Stokenet
const storageModule = LocalStorageModule(
  `rdt:${dAppDefinitionAddress}:${networkId}`,
  {
    providers: {
      environmentModule: EnvironmentModule(),
    },
  },
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

  <div class="mt-25">
    <button id="one-time-request">Send one time request</button>
  </div>
  <div class="mt-25">
    <button id="proof-of-ownership-request">Send proof of ownership request</button>
  </div>
  <hr/>
    <textarea id="subintentManifest" cols="50" rows="10">ASSERT_WORKTOP_RESOURCES_INCLUDE
    Map<Address, Enum>(
        Address("resource_tdx_2_1t5cjs290gd2v4pm5rys02ty372zapefjejqm3w6ktcxj9aw3e7t4jw") => Enum<ResourceConstraint::General>(
            Tuple(
                Array<NonFungibleLocalId>(),
                Enum<LowerBound::NonZero>(),
                Enum<UpperBound::Unbounded>(),
                Enum<AllowedIds::Any>()
            )
        ),
        Address("resource_tdx_2_1t5dapa24l4xvwqtqe2jrdphtn7ga46gw67wr9fwn4gp532myfjqpck") => Enum<ResourceConstraint::General>(
            Tuple(
                Array<NonFungibleLocalId>(),
                Enum<LowerBound::Inclusive>(Decimal("6")),
                Enum<UpperBound::Unbounded>(),
                Enum<AllowedIds::Any>()
            )
        ),
        Address("resource_tdx_2_1th9k30slgu9uekfu42llstgcq80dx8d59hxgexe5hdaqzyp8etc2dv") => Enum<ResourceConstraint::General>(
            Tuple(
                Array<NonFungibleLocalId>(),
                Enum<LowerBound::NonZero>(),
                Enum<UpperBound::Inclusive>(Decimal("10")),
                Enum<AllowedIds::Any>()
            )
        ),
        Address("resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc") => Enum<ResourceConstraint::General>(
            Tuple(
                Array<NonFungibleLocalId>(),
                Enum<LowerBound::Inclusive>(Decimal("2")),
                Enum<UpperBound::Inclusive>(Decimal("5")),
                Enum<AllowedIds::Any>()
            )
        ),
        Address("resource_tdx_2_1thjlp88pc28eyfg3f2alq8zkggnr273j0saye4nj70vfnga6ldy7ru") => Enum<ResourceConstraint::General>(
            Tuple(
                Array<NonFungibleLocalId>(),
                Enum<LowerBound::Inclusive>(Decimal("3")),
                Enum<UpperBound::Inclusive>(Decimal("3")),
                Enum<AllowedIds::Any>()
            )
        ),
    )
;

CALL_METHOD
    Address("account_tdx_2_12xuly5lqj0vzqctehs7a3c9wdjduh5sjelp2ywydw2ur4v3kjwlaly")
    "deposit_batch"
    Expression("ENTIRE_WORKTOP")
;

YIELD_TO_PARENT;</textarea>

  <div class="mt-25">
    <label>
      <input checked type="radio" name="option" value="secondsAfterSignature"> afterDelay
    </label>
    <label>
      <input type="radio" name="option" value="atTime"> atTime
    </label>
  </div>

   <input id="subintentExpirationValue" type="text" value="3600"/>
    
    <button id="subintent">Send Pre Authorization</button>
  <hr/>

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
const subintentButton = document.getElementById('subintent')!
const subintentManifest = document.getElementById(
  'subintentManifest',
)! as HTMLTextAreaElement
const subintentExpirationValue = document.getElementById(
  'subintentExpirationValue',
)! as HTMLInputElement
const requests = document.getElementById('requests')!
const logs = document.getElementById('logs')!
const state = document.getElementById('state')!
const gatewayConfig = document.getElementById('gatewayConfig')!
const gatewayStatus = document.getElementById('gatewayStatus')!
const oneTimeRequest = document.getElementById('one-time-request')!
const proofOfOwnershipRequest = document.getElementById(
  'proof-of-ownership-request',
)!

let subintentExpiration: 'afterDelay' | 'atTime' = 'afterDelay'

document.querySelectorAll('input[name="option"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    const selectedOption = document.querySelector(
      'input[name="option"]:checked',
    ) as HTMLInputElement
    if (selectedOption) {
      console.log(`Selected value: ${selectedOption.value}`)
      subintentExpiration = selectedOption.value as 'afterDelay' | 'atTime'
    }
  })
})

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

subintentButton.onclick = async () => {
  console.log(subintentManifest.value)
  console.log(subintentExpirationValue.value)
  const result = await dAppToolkit.walletApi.sendPreAuthorizationRequest(
    SubintentRequestBuilder()
      .manifest(subintentManifest.value)
      .setExpiration(
        subintentExpiration,
        parseInt(subintentExpirationValue.value as string),
      ),
  )

  console.log('result', result.isOk() && result.value)
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

sendTxButton.onclick = async () => {
  const res = await dAppToolkit.walletApi.sendTransaction({
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
  console.log('send tx result', res)
}

oneTimeRequest.onclick = () => {
  dAppToolkit.walletApi.sendOneTimeRequest(
    OneTimeDataRequestBuilder.accounts().exactly(1),
  )
}

proofOfOwnershipRequest.onclick = async () => {
  const connectedAccounts =
    dAppToolkit.walletApi.getWalletData()?.accounts ?? []
  const connectedPersona = dAppToolkit.walletApi.getWalletData()?.persona

  if (connectedAccounts.length === 0 || !connectedPersona) {
    alert('No connected account or persona')
    return
  }

  const result = await dAppToolkit.walletApi.sendOneTimeRequest(
    OneTimeDataRequestBuilder.accounts().exactly(1),
    OneTimeDataRequestBuilder.proofOfOwnership()
      .accounts(connectedAccounts.map((account) => account.address))
      .identity(connectedPersona.identityAddress),
  )

  console.log(result)

  alert(`Result is ok: ${result.isOk()}`)
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
