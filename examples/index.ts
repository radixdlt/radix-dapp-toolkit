import { RadixDappToolkit } from '../src/radix-dapp-toolkit'
import { Logger } from 'tslog'
import { html, render, LitElement, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { Account, PersonaDataField } from '@radixdlt/connect-button'
import { DataRequestInput } from '../src/_types'
import { styleMap } from 'lit/directives/style-map.js'
import { Buffer } from 'buffer'

const update_metadata = (account_component_address: string) =>
  `SET_METADATA ComponentAddress("${account_component_address}") "name" "test name";   
   SET_METADATA ComponentAddress("${account_component_address}") "description" "test description";     
   SET_METADATA ComponentAddress("${account_component_address}") "domain" "test.domain";     
   SET_METADATA ComponentAddress("${account_component_address}") "account_type" "dapp definition";`.trim()

const create_token = (account_component_address: string) => `
CREATE_FUNGIBLE_RESOURCE
    18u8
    Map<String, String>(
        "name", "MyResource",                                        # Resource Name
        "symbol", "RSRC",                                            # Resource Symbol
        "description", "A very innovative and important resource"    # Resource Description
    ) 
    Map<Enum, Tuple>(
        Enum("ResourceMethodAuthKey::Withdraw"), Tuple(Enum("AccessRule::AllowAll"), Enum("AccessRule::DenyAll")),
        Enum("ResourceMethodAuthKey::Deposit"), Tuple(Enum("AccessRule::AllowAll"), Enum("AccessRule::DenyAll"))
    )
    Some(Decimal("500000"));

  CALL_METHOD
    ComponentAddress("${account_component_address}") 
    "deposit_batch"
    Expression("ENTIRE_WORKTOP");
`

const transfer_token = (payer: string, payee: string) => `
CALL_METHOD 
    ComponentAddress("${payer}") 
    "withdraw_by_amount"
    Decimal("100")
    ResourceAddress("resource_tdx_22_1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqj3nwpk");

CALL_METHOD
    ComponentAddress("${payee}") 
    "deposit_batch"
    Expression("ENTIRE_WORKTOP");`

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
        'account_tdx_b_1pps97zsqhgdawcth6hmnfapa8ez8wr0wdt5na7th2cpsuejx7h',
      dAppName: 'Test dApp',
    },
    (requestData) => {
      requestData(this.request as any).map((response) => {
        this.accounts = response.data.accounts
        this.response = response
      })
    },
    {
      logger: new Logger(),
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
        baseUrl: 'https://hammunet-dashboard.rdx-works-main.extratools.works/',
        accountsPath: 'account/',
        transactionPath: 'transaction/',
      },
      useCache: false,
      onStateChange: (state) => {
        this.state = state
      },
    }
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

  private createTokenRequest() {
    return this.accounts.length
      ? html`<radix-button
          fullWidth
          @click=${() => {
            this.rdt
              .sendTransaction({
                transactionManifest: create_token(this.accounts[0].address),
                version: 1,
                message: 'Example message added by dApp when creating token',
              })
              .map((response) => {
                this.response = response
              })
              .mapErr((response) => {
                this.response = response
              })
          }}
        >
          Create token
        </radix-button>`
      : ''
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

  private updateMetadata() {
    return this.accounts.length
      ? html`<radix-button
          fullWidth
          @click=${() => {
            this.rdt
              .sendTransaction({
                version: 1,
                transactionManifest: update_metadata(this.accounts[0].address),
                message: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                  Nullam pulvinar at metus eget congue. Aenean volutpat metus in imperdiet rhoncus. 
                  Suspendisse ac eleifend eros. Maecenas venenatis lacus suscipit erat hendrerit sagittis.`,
              })
              .map((response) => {
                this.response = response
              })
              .mapErr((response) => {
                this.response = response
              })
          }}
        >
          Update metadata
        </radix-button>`
      : ''
  }

  private transferToken() {
    return this.accounts.length
      ? html`<radix-button
          fullWidth
          @click=${() => {
            this.rdt
              .sendTransaction({
                version: 1,
                transactionManifest: transfer_token(
                  this.accounts[0].address,
                  this.accounts[0].address
                ),
                message: 'Example message when doing transfer token',
              })
              .map((response) => {
                this.response = response
              })
              .mapErr((response) => {
                this.response = response
              })
          }}
        >
          Transfer token
        </radix-button>`
      : ''
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
        ${this.dataRequest()} ${this.updateSharedDataRequest()}
        ${this.createTokenRequest()} ${this.transferToken()}
        ${this.updateMetadata()}${this.disconnect()}
        <!-- ${this.walletRequestTemplate()}  -->
        ${this.walletResponseTemplate()} ${this.stateTemplate()}
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
