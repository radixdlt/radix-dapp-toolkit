import { RadixDappToolkit } from '../src/radix-dapp-toolkit'
import { html, render, LitElement, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { Account, PersonaDataField } from '@radixdlt/connect-button'
import { DataRequestInput } from '../src/_types'
import { styleMap } from 'lit/directives/style-map.js'
import { Buffer } from 'buffer'
import gumballWasmUrl from './assets/gumball_machine.wasm?url'
import gumballSchemaUrl from './assets/gumball_machine.schema?url'
import { ResultAsync } from 'neverthrow'
import { loadBinaryFromUrl } from './helpers/load-binary-from-url'
import { GatewayApiClient } from '../src/gateway/gateway-api'
import { networkIdMap } from '../src/gateway/_types'
import { getCreateBadgeManifest } from './manifests/create-badge'
import { getDeployPackageManifest } from './manifests/deploy-package'
import {
  Decimal,
  Expression,
  ManifestBuilder,
  createLogger,
} from '@radixdlt/wallet-sdk'
import {
  ExampleOptions,
  getExample1,
  getExample2,
  getExample3,
  getExample4,
  getExample5,
  getExample6,
} from './manifests/examples'

@customElement('example-dapp')
// @ts-ignore
class ExampleDapp extends LitElement {
  static styles = css`
    :host {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
        'Segoe UI Symbol';
      display: block;
      color: #242424;
      height: 100%;
      padding: 1rem;
    }

    ::slotted(radix-connect-button) {
      align-self: center;
    }

    header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid black;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }

    pre {
      text-align: left;
      background: black;
      color: greenyellow;
      padding: 1rem;
    }

    h1 {
      font-size: 1.5rem;
      padding: 0;
      margin: 0;
      margin-block: 0;
      line-height: 1.5rem;
      align-self: center;
    }

    radix-button {
      display: block;
      margin-bottom: 15px;
      width: 200px;
    }

    .content {
      text-align: center;
    }
  `
  @state()
  request: DataRequestInput<false> | undefined = {
    accounts: { quantifier: 'atLeast', quantity: 1, reset: false },
    personaData: {
      fields: ['givenName', 'emailAddress', 'familyName', 'phoneNumber'],
      reset: false,
    },
  }

  @state()
  accounts: Account[] = []

  @state()
  response: any

  @state()
  logging: any

  @state()
  state: any

  constructor() {
    super()
    try {
      const hash = window.location.hash
      if (hash) {
        const stringified = Buffer.from(hash.slice(1), 'base64').toString()
        const request = JSON.parse(stringified)
        this.request = request
      }
    } catch (error) {}
  }

  get networkId() {
    const urlParams = new URLSearchParams(window.location.search)
    const networkId = parseInt(urlParams.get('networkId') || '12', 10)
    return networkId
  }

  private rdt = RadixDappToolkit(
    {
      dAppDefinitionAddress:
        'account_tdx_c_1p8qv9lqua5lv8j2r784mpemtc2fwhzlp7ftfm2xrwg5q54zjcv',
      dAppName: 'RDT Example dApp',
    },
    (requestData) => {
      requestData(this.request as any).map((response) => {
        this.accounts = response.data.accounts
        this.response = response
      })
    },
    {
      logger: createLogger(1),
      networkId: this.networkId,
      onDisconnect: () => {
        this.accounts = []
      },
      onInit: ({ accounts }) => {
        this.accounts = accounts ?? []
      },
      onReset: (requestData) => {
        requestData({ accounts: { quantifier: 'atLeast', quantity: 2 } })
      },
      explorer: {
        baseUrl: 'https://rcnet-dashboard.radixdlt.com/',
        accountsPath: 'account/',
        transactionPath: 'transaction/',
      },
      useCache: false,
      onStateChange: (state) => {
        this.state = state
      },
    }
  )

  private gatewayApi = GatewayApiClient(
    networkIdMap.get(this.networkId) || 'https://gateway.radixdlt.com'
  )

  private dataRequest() {
    return html`<radix-button
      fullWidth
      @click=${() => {
        this.rdt
          .requestData(this.request as any)
          .map((response) => {
            this.accounts = response.accounts
            this.response = response
          })
          .mapErr((response) => {
            this.response = response
          })
      }}
    >
      Send data request
    </radix-button>`
  }

  private updateSharedDataRequest() {
    return html`<radix-button
      fullWidth
      @click=${() => {
        this.rdt.updateSharedData()
      }}
    >
      Update shared data
    </radix-button>`
  }

  private disconnect() {
    return html`<radix-button
      fullWidth
      @click=${() => {
        this.rdt.disconnect()
      }}
    >
      Disconnect
    </radix-button>`
  }

  private headerTemplate() {
    return html`<header>
      <h1>Example dApp</h1>
      <slot></slot>
    </header>`
  }

  private walletResponseTemplate() {
    return html`<pre>
Response ${this.response ? JSON.stringify(this.response, null, 2) : `{}`}</pre
    >`
  }

  private loggingTemplate() {
    return html`<pre .innerHTML=${this.logging || ''}></pre>`
  }

  private walletRequestTemplate() {
    return html`<pre>Request ${JSON.stringify(this.request, null, 2)}</pre>`
  }

  private stateTemplate() {
    return html`<pre>State ${JSON.stringify(this.state, null, 2)}</pre>`
  }

  private updateRequest(request: DataRequestInput<false>) {
    const base64 = Buffer.from(JSON.stringify(request)).toString('base64')
    window.location.hash = base64
    this.request = request
  }

  render() {
    return html`<div>
      ${this.headerTemplate()}
      <div class="content">
        <div style=${styleMap({ width: '600px' })}>
          <fieldset style=${styleMap({ marginBottom: '15px' })}>
            <legend>
              <input
                type="checkbox"
                id="accountsInclude"
                name="accounts"
                .checked=${!!this.request!.accounts}
                @click=${() => {
                  const { accounts, ...rest } = this.request!
                  if (accounts) this.updateRequest(rest)
                  else
                    this.updateRequest({
                      accounts: {
                        quantifier: 'atLeast',
                        quantity: 1,
                        reset: false,
                      },
                      ...this.request,
                    })
                }}
              />
              <label for="accountsInclude">Accounts</label>
            </legend>
            <div style=${styleMap({ marginBottom: '10px' })}>
              <input
                @click=${() => {
                  this.updateRequest({
                    ...this.request,
                    accounts: { ...this.request!.accounts!, oneTime: true },
                  })
                }}
                type="radio"
                id="accountsOneTime"
                name="accounts"
                .checked=${!!this.request?.accounts?.oneTime}
                .disabled=${!this.request?.accounts}
              />
              <label for="accountsOneTime">oneTime</label>
              <input
                type="radio"
                id="accountsOngoing"
                name="accounts"
                .checked=${!this.request?.accounts?.oneTime}
                .disabled=${!this.request?.accounts}
                @click=${() => {
                  const { oneTime, ...accounts } = this.request!.accounts!
                  this.updateRequest({
                    ...this.request,
                    accounts,
                  })
                }}
              />
              <label for="accountsOngoing">ongoing</label>
            </div>
            <div style=${styleMap({ marginBottom: '10px' })}>
              <input
                @click=${() => {
                  this.updateRequest({
                    ...this.request,
                    accounts: {
                      ...this.request!.accounts!,
                      quantifier: 'atLeast',
                    },
                  })
                }}
                type="radio"
                id="accountsAtleast"
                name="accountsQuantity"
                .checked=${this.request?.accounts?.quantifier === 'atLeast'}
                .disabled=${!this.request?.accounts}
              />
              <label for="accountsAtleast">atLeast</label>
              <input
                type="radio"
                id="accountsExactly"
                name="accountsQuantity"
                .checked=${this.request?.accounts?.quantifier === 'exactly'}
                .disabled=${!this.request?.accounts}
                @click=${() => {
                  this.updateRequest({
                    ...this.request,
                    accounts: {
                      ...this.request!.accounts!,
                      quantifier: 'exactly',
                    },
                  })
                }}
              />
              <label for="accountsExactly">exactly</label>
            </div>
            <div style=${styleMap({ marginBottom: '10px' })}>
              <input
                type="checkbox"
                id="accountsReset"
                name="accountsReset"
                .checked=${!!this.request?.accounts?.reset}
                .disabled=${!this.request?.accounts}
                @click=${() => {
                  this.updateRequest({
                    ...this.request,
                    accounts: {
                      ...this.request?.accounts!,
                      reset: !this.request!.accounts!.reset,
                    },
                  })
                }}
              />
              <label for="accountsReset">reset</label>
            </div>
            <div style=${styleMap({ marginBottom: '10px' })}>
              <input
                type="number"
                placeholder="quantity"
                id="accountsExactly"
                name="accountsQuantity"
                value=${this.request?.accounts?.quantity ?? 0}
                .disabled=${!this.request?.accounts}
                @change=${(event: InputEvent) => {
                  this.updateRequest({
                    ...this.request,
                    accounts: {
                      ...this.request!.accounts!,
                      quantity: parseInt(
                        (event.target as HTMLInputElement)!.value
                      ),
                    },
                  })
                }}
              />
            </div>
          </fieldset>
          <fieldset style=${styleMap({ marginBottom: '15px' })}>
            <legend>
              <input
                type="checkbox"
                id="personaDataInclude"
                name="accounts"
                .checked=${!!this.request!.personaData}
                @click=${() => {
                  const { personaData, ...rest } = this.request!
                  if (personaData) this.updateRequest(rest)
                  else
                    this.updateRequest({
                      ...this.request,
                      personaData: {
                        fields: [
                          'givenName',
                          'emailAddress',
                          'familyName',
                          'phoneNumber',
                        ],
                        reset: false,
                      },
                    })
                }}
              />
              <label for="personaDataInclude">PersonaData</label>
            </legend>
            <div style=${styleMap({ marginBottom: '10px' })}>
              <input
                @click=${() => {
                  this.updateRequest({
                    ...this.request,
                    personaData: {
                      ...this.request!.personaData!,
                      oneTime: true,
                    },
                  })
                }}
                type="radio"
                id="personaDataOneTime"
                name="personaData"
                .checked=${!!this.request?.personaData?.oneTime}
                .disabled=${!this.request?.personaData}
              />
              <label for="personaDataOneTime">oneTime</label>
              <input
                type="radio"
                id="personaDataOngoing"
                name="personaData"
                .checked=${!this.request?.personaData?.oneTime}
                .disabled=${!this.request?.personaData}
                @click=${() => {
                  const { oneTime, ...personaData } = this.request!.personaData!
                  this.updateRequest({
                    ...this.request,
                    personaData,
                  })
                }}
              />
              <label for="personaDataOngoing">ongoing</label>
            </div>
            <div style=${styleMap({ marginBottom: '10px' })}>
              ${['givenName', 'emailAddress', 'familyName', 'phoneNumber'].map(
                (item) => html`
                  <input
                    type="checkbox"
                    id=${'personaDataField' + item}
                    name="personaDataFields"
                    .checked=${!!this.request!.personaData?.fields.includes(
                      item as PersonaDataField
                    )}
                    @change=${() => {
                      const field = item as PersonaDataField
                      const fields = this.request!.personaData!.fields

                      this.updateRequest({
                        ...this.request,
                        personaData: {
                          ...this.request?.personaData,
                          fields: fields.includes(field)
                            ? fields.filter((value) => value !== field)
                            : [...fields, field],
                        },
                      })
                    }}
                  />
                  <label for=${'personaDataField' + item}>${item}</label>
                `
              )}
            </div>
            <div style=${styleMap({ marginBottom: '10px' })}>
              <input
                type="checkbox"
                id="personaDataReset"
                name="personaDataReset"
                .checked=${!!this.request?.personaData?.reset}
                .disabled=${!this.request?.personaData}
                @click=${() => {
                  this.updateRequest({
                    ...this.request,
                    personaData: {
                      ...this.request?.personaData!,
                      reset: !this.request!.personaData!.reset,
                    },
                  })
                }}
              />
              <label for="personaDataReset">reset</label>
            </div>
          </fieldset>
        </div>
        ${this.loggingTemplate()}
        <radix-button
          fullWidth
          @click=${() => {
            this.logging = 'Getting 3 accounts from wallet'
            this.rdt
              .requestData({
                accounts: { quantifier: 'exactly', quantity: 3, oneTime: true },
              })
              .andThen(({ accounts }) => {
                const transactionManifest = getCreateBadgeManifest(
                  accounts[0].address
                )
                this.logging = `Creating badge for deploying package 

${transactionManifest}`
                return this.rdt
                  .sendTransaction({
                    transactionManifest,
                    version: 0,
                  })
                  .map((response) => {
                    this.response = response
                    return response
                  })
                  .andThen(({ transactionIntentHash }) =>
                    this.rdt.gatewayApi.getTransactionDetails(
                      transactionIntentHash
                    )
                  )
                  .map((response) => {
                    this.response = response
                    return response
                  })
                  .andThen(() =>
                    this.rdt.gatewayApi.getEntityDetails(accounts[0].address)
                  )
                  .map((response) => {
                    this.response = response
                    return response
                  })
                  .andThen((details) => {
                    const non_fungible_resources =
                      details.non_fungible_resources || { items: [] }

                    const { resource_address: nftAddress, vaults } =
                      non_fungible_resources.items[0]

                    return ResultAsync.combine([
                      loadBinaryFromUrl(gumballWasmUrl),
                      loadBinaryFromUrl(gumballSchemaUrl),
                      this.rdt.gatewayApi.getEntityNonFungibleIds({
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
                      this.logging = `Deploying Gumball Machine package 

${transactionManifest}`
                      return this.rdt.sendTransaction({
                        transactionManifest,
                        blobs: [wasm, abi],
                        version: 1,
                      })
                    })
                  })
                  .map((response) => {
                    this.response = response
                    return response
                  })
                  .andThen(({ transactionIntentHash }) =>
                    this.rdt.gatewayApi
                      .getTransactionDetails(transactionIntentHash)
                      .map(
                        (response) =>
                          response.details.referenced_global_entities[0]
                      )
                  )
                  .map((response) => {
                    this.response = response
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

                    this.logging = `Instantiating Gumball Machine 

${transactionManifest}`

                    return ResultAsync.combine([
                      this.rdt.sendTransaction({
                        transactionManifest,
                        version: 1,
                      }),
                      this.rdt.sendTransaction({
                        transactionManifest,
                        version: 1,
                      }),
                    ])
                  })
                  .map((response) => {
                    this.response = response
                    return response
                  })
                  .andThen(([response1, response2]) =>
                    ResultAsync.combine([
                      this.rdt.gatewayApi.getTransactionDetails(
                        response1.transactionIntentHash
                      ),
                      this.rdt.gatewayApi.getTransactionDetails(
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
                      this.logging = `Example 1 	
1) Withdraw 10 XRD from Alpha
2) Create bucket of 10 XRD
3) Call buy_gumball with bucket
4) Create bucket of 1 gumball (need resource address!)
5) Deposit gumball bucket to Alpha
6) Deposit entire worktop to Bravo

${JSON.stringify(options, null, 2)}

${transactionManifest}`
                      return this.rdt
                        .sendTransaction({
                          transactionManifest,
                          version: 1,
                        })
                        .andThen(() => {
                          const transactionManifest = getExample2(options)
                          this.logging = `Example 2
1) Withdraw 0.5 XRD from Alpha
2) Withdraw 0.5 XRD from Bravo
3) Create bucket of 1 XRD
4) Call buy_gumball with bucket
5) Deposit entire worktop to Alpha

${JSON.stringify(options, null, 2)}

${transactionManifest}`
                          return this.rdt.sendTransaction({
                            transactionManifest,
                            version: 1,
                          })
                        })
                        .andThen(() => {
                          const transactionManifest = getExample3(options)
                          this.logging = `Example 3
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

${transactionManifest}`
                          return this.rdt.sendTransaction({
                            transactionManifest,
                            version: 1,
                          })
                        })
                        .andThen(() => {
                          const transactionManifest = getExample4(options)
                          this.logging = `Example 4
1) Create proof of admin badge from Alpha
2) Call NYI withdraw_funds
  a) Deposit entire worktop to Alpha

${JSON.stringify(options, null, 2)}

${transactionManifest}`
                          return this.rdt.sendTransaction({
                            transactionManifest,
                            version: 1,
                          })
                        })
                        .andThen(() => {
                          const transactionManifest = getExample5(options)
                          this.logging = `Example 5
1) Withdraw 10 XRD from Bravo
2) Create proof of admin badge from Alpha
3) Create bucket of 5 XRD
4) Call buy_gumball with bucket
5) Call withdraw_funds
6) Deposit entire worktop to Alpha

${JSON.stringify(options, null, 2)}

${transactionManifest}`
                          return this.rdt.sendTransaction({
                            transactionManifest,
                            version: 1,
                          })
                        })
                        .andThen(() => {
                          const transactionManifest = getExample6(options)
                          this.logging = `Example 6
Instantiate another gumball machine prior to this scenario, again assuming price of 1

1) Withdraw 2 XRD from Alpha
2) Create bucket of 2 XRD
3) Call buy_gumball on machine A with bucket
4) Create bucket of all XRD
5) Call buy_gumball on machine B with bucket
6) Deposit entire worktop to Bravo

${JSON.stringify(options, null, 2)}

${transactionManifest}`
                          return this.rdt.sendTransaction({
                            transactionManifest,
                            version: 1,
                          })
                        })
                    })
                  )
                  .map((response) => {
                    this.response = response
                    return response
                  })
                  .mapErr((error) => {
                    this.response = error
                  })
              })
          }}
        >
          Gumball Machine
        </radix-button>
        ${this.dataRequest()} ${this.updateSharedDataRequest()}
        ${this.disconnect()} ${this.walletResponseTemplate()}
        ${this.stateTemplate()}
      </div>
    </div>`
  }
}

render(
  html`<style>
      body {
        margin: 0;
        height: 100vh;
      }</style
    ><example-dapp
      ><radix-connect-button></radix-connect-button
    ></example-dapp>`,
  document.body
)
