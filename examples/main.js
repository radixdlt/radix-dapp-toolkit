import {
  RadixDappToolkit,
  DataRequestBuilder,
  RadixNetwork,
  createLogger,
} from '../src/index.ts'
import { Buffer } from 'buffer'
document.querySelector('#app').innerHTML = `
  <radix-connect-button />
`

const rdt = RadixDappToolkit({
  dAppDefinitionAddress:
    'account_tdx_2_12xe9tn7ns389ervyuwxkhyyrscfyjug00y8a4lhk5hwt4lfq9jarft',
  networkId: RadixNetwork.Stokenet,
  useCache: false,
  logger: createLogger(),
})

rdt.walletApi.setRequestData(
  DataRequestBuilder.persona().withProof(),
  DataRequestBuilder.accounts().atLeast(1),
  DataRequestBuilder.personaData().fullName().emailAddresses()
)

rdt.walletApi.walletData$.subscribe((state) => {
  console.log(state)
})

rdt.walletApi.provideChallengeGenerator(() =>
  Promise.resolve(
    Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')
  )
)
