import { RadixDappToolkit } from '../src/radix-dapp-toolkit'
import { Logger } from 'tslog'
import { html, render, LitElement, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { Account } from '@radixdlt/connect-button'

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
  accounts: Account[] = []

  @state()
  response: any

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
      requestData({
        accounts: { quantifier: 'atLeast', quantity: 1 },
        personaData: {
          fields: ['givenName', 'emailAddress', 'familyName', 'phoneNumber'],
        },
      }).map((response) => {
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
    }
  )

  private oneTimeRequest() {
    return html`<radix-button
      fullWidth
      @click=${() => {
        this.rdt
          .requestData({
            accounts: { quantifier: 'exactly', quantity: 1, oneTime: true },
            personaData: {
              fields: [
                'givenName',
                'emailAddress',
                'familyName',
                'phoneNumber',
              ],
              oneTime: true,
            },
          })
          .map((response) => {
            this.accounts = response.accounts
            this.response = response
          })
          .mapErr((response) => {
            this.response = response
          })
      }}
    >
      OneTimeRequest
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

  private ongoingRequest() {
    return html`<radix-button
      fullWidth
      @click=${() => {
        this.rdt
          .requestData({
            accounts: { quantifier: 'exactly', quantity: 3 },
            personaData: { fields: ['givenName'] },
          })
          .map((response) => {
            this.accounts = response.accounts
            this.response = response
          })
          .mapErr((response) => {
            this.response = response
          })
      }}
    >
      OngoingRequest
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
    return this.response
      ? html`<pre>
Wallet response
${JSON.stringify(this.response, null, 2)}</pre
        >`
      : ''
  }

  render() {
    return html`<div>
      ${this.headerTemplate()}
      <div class="content">
        ${this.oneTimeRequest()}
        ${this.ongoingRequest()}${this.updateSharedDataRequest()}
        ${this.createTokenRequest()} ${this.transferToken()}
        ${this.updateMetadata()}${this.disconnect()}${this.walletResponseTemplate()}
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
