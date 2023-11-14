import {
  RadixDappToolkit,
  DataRequestBuilder,
  RadixNetwork,
} from '../src/index.ts'

document.querySelector('#app').innerHTML = `
  <radix-connect-button />
`

const rdt = RadixDappToolkit({
  dAppDefinitionAddress: '',
  networkId: RadixNetwork.Stokenet,
  useCache: false,
})

rdt.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1))

rdt.walletApi.walletData$.subscribe((state) => {
  console.log(state)
})

rdt.walletApi.provideChallengeGenerator(async () =>
  Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')
)
