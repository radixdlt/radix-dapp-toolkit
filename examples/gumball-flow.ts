import { RadixDappToolkit } from '../src/radix-dapp-toolkit'
import { html } from 'lit'
import gumballWasmUrl from './assets/gumball_machine.wasm?url'
import gumballSchemaUrl from './assets/gumball_machine.schema?url'
import { ResultAsync } from 'neverthrow'
import { loadBinaryFromUrl } from './helpers/load-binary-from-url'
import { getCreateBadgeManifest } from './manifests/create-badge'
import { getDeployPackageManifest } from './manifests/deploy-package'
import { Decimal, Expression, ManifestBuilder } from '@radixdlt/wallet-sdk'
import {
  ExampleOptions,
  getExample1,
  getExample2,
  getExample3,
  getExample4,
  getExample5,
  getExample6,
} from './manifests/examples'

export const GumballFlow = (
  rdt: ReturnType<typeof RadixDappToolkit>,
  setLog: (value: string) => void,
  setResponse: (value: any) => void
) => html` <radix-button
  fullWidth
  @click=${() => {
    setLog('Getting 3 accounts from wallet')
    rdt
      .requestData({
        accounts: { quantifier: 'exactly', quantity: 3, oneTime: true },
      })
      .andThen(({ accounts }) => {
        const transactionManifest = getCreateBadgeManifest(accounts[0].address)
        setLog(`Creating badge for deploying package ${transactionManifest}`)
        return rdt
          .sendTransaction({
            transactionManifest,
            version: 0,
          })
          .map((response) => {
            setResponse(response)
            return response
          })
          .andThen(({ transactionIntentHash }) =>
            rdt.gatewayApi.getTransactionDetails(transactionIntentHash)
          )
          .map((response) => {
            setResponse(response)
            return response
          })
          .andThen(() => rdt.gatewayApi.getEntityDetails(accounts[0].address))
          .map((response) => {
            setResponse(response)
            return response
          })
          .andThen((details) => {
            const non_fungible_resources = details.non_fungible_resources || {
              items: [],
            }

            const { resource_address: nftAddress, vaults } =
              non_fungible_resources.items[0]

            return ResultAsync.combine([
              loadBinaryFromUrl(gumballWasmUrl),
              loadBinaryFromUrl(gumballSchemaUrl),
              rdt.gatewayApi.getEntityNonFungibleIds({
                accountAddress: accounts[0].address,
                nftAddress,
                vaultAddress: vaults.items[0].vault_address,
              }),
            ]).andThen(([wasm, abi, { items }]) => {
              const transactionManifest = getDeployPackageManifest({
                nftAddress,
                nftId: items[0].non_fungible_id,
                wasm,
                abi,
              })
              setLog(`Deploying Gumball Machine package ${transactionManifest}`)
              return rdt.sendTransaction({
                transactionManifest,
                blobs: [wasm, abi],
                version: 1,
              })
            })
          })
          .map((response) => {
            setResponse(response)
            return response
          })
          .andThen(({ transactionIntentHash }) =>
            rdt.gatewayApi
              .getTransactionDetails(transactionIntentHash)
              .map((response) => response.details.referenced_global_entities[0])
          )
          .map((response) => {
            setResponse(response)
            return response
          })
          .andThen((packageAddress) => {
            const transactionManifest = new ManifestBuilder()
              .callFunction(
                packageAddress,
                'GumballMachine',
                'instantiate_gumball_machine',
                [Decimal(1), `"ScryptoCola"`]
              )
              .callMethod(accounts[0].address, 'deposit_batch', [
                Expression('ENTIRE_WORKTOP'),
              ])
              .build()
              .toString()

            setLog(`Instantiating Gumball Machine ${transactionManifest}`)

            return ResultAsync.combine([
              rdt.sendTransaction({
                transactionManifest,
                version: 1,
              }),
              rdt.sendTransaction({
                transactionManifest,
                version: 1,
              }),
            ])
          })
          .map((response) => {
            setResponse(response)
            return response
          })
          .andThen(([response1, response2]) =>
            ResultAsync.combine([
              rdt.gatewayApi.getTransactionDetails(
                response1.transactionIntentHash
              ),
              rdt.gatewayApi.getTransactionDetails(
                response2.transactionIntentHash
              ),
            ]).map(([response1, response2]) => {
              const [
                componentAddress,
                adminBadgeAddress,
                staffBadgeAddress,
                gumballAddress,
              ] = response1.details.referenced_global_entities
              const [componentAddress2] =
                response2.details.referenced_global_entities
              const options: ExampleOptions = {
                accountA: accounts[0].address,
                accountB: accounts[1].address,
                accountC: accounts[2].address,
                xrdAddress:
                  'resource_tdx_c_1qyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq40v2wv',
                gumballMachineComponentAddress: componentAddress,
                gumballResourceAddress: gumballAddress,
                gumballMachineComponent2Address: componentAddress2,
                adminBadgeAddress,
              }
              const transactionManifest = getExample1(options)
              setLog(`Example 1 	
1) Withdraw 10 XRD from Alpha
2) Create bucket of 10 XRD
3) Call buy_gumball with bucket
4) Create bucket of 1 gumball (need resource address!)
5) Deposit gumball bucket to Alpha
6) Deposit entire worktop to Bravo

${JSON.stringify(options, null, 2)}

${transactionManifest}`)
              return rdt
                .sendTransaction({
                  transactionManifest,
                  version: 1,
                })
                .andThen(() => {
                  const transactionManifest = getExample2(options)
                  setLog(`Example 2
1) Withdraw 0.5 XRD from Alpha
2) Withdraw 0.5 XRD from Bravo
3) Create bucket of 1 XRD
4) Call buy_gumball with bucket
5) Deposit entire worktop to Alpha

${JSON.stringify(options, null, 2)}

${transactionManifest}`)
                  return rdt.sendTransaction({
                    transactionManifest,
                    version: 1,
                  })
                })
                .andThen(() => {
                  const transactionManifest = getExample3(options)
                  setLog(`Example 3
1) Withdraw 5 XRD from Alpha
2) Withdraw 3 XRD from Alpha
3) Create bucket “Delta” of 2 XRD
4) Create bucket “Echo” of 2.5 XRD
5) Create bucket “Foxtrot” of 3.5 XRD
6) Call buy_gumball with bucket Delta
7) Create bucket “Golf” of 1 XRD
8) Call deposit_batch on Alpha with buckets Echo, Foxtrot
9) Call deposit on Charlie with bucket Golf
10) Deposit entire worktop to Alpha

${JSON.stringify(options, null, 2)}

${transactionManifest}`)
                  return rdt.sendTransaction({
                    transactionManifest,
                    version: 1,
                  })
                })
                .andThen(() => {
                  const transactionManifest = getExample4(options)
                  setLog(`Example 4
1) Create proof of admin badge from Alpha
2) Call NYI withdraw_funds
a) Deposit entire worktop to Alpha

${JSON.stringify(options, null, 2)}

${transactionManifest}`)
                  return rdt.sendTransaction({
                    transactionManifest,
                    version: 1,
                  })
                })
                .andThen(() => {
                  const transactionManifest = getExample5(options)
                  setLog(`Example 5
1) Withdraw 10 XRD from Bravo
2) Create proof of admin badge from Alpha
3) Create bucket of 5 XRD
4) Call buy_gumball with bucket
5) Call withdraw_funds
6) Deposit entire worktop to Alpha

${JSON.stringify(options, null, 2)}

${transactionManifest}`)
                  return rdt.sendTransaction({
                    transactionManifest,
                    version: 1,
                  })
                })
                .andThen(() => {
                  const transactionManifest = getExample6(options)
                  setLog(`Example 6
Instantiate another gumball machine prior to this scenario, again assuming price of 1

1) Withdraw 2 XRD from Alpha
2) Create bucket of 2 XRD
3) Call buy_gumball on machine A with bucket
4) Create bucket of all XRD
5) Call buy_gumball on machine B with bucket
6) Deposit entire worktop to Bravo

${JSON.stringify(options, null, 2)}

${transactionManifest}`)
                  return rdt.sendTransaction({
                    transactionManifest,
                    version: 1,
                  })
                })
            })
          )
          .map((response) => {
            setResponse(response)
            return response
          })
          .mapErr((error) => {
            setResponse(error)
          })
      })
  }}
>
  Gumball Machine
</radix-button>`
