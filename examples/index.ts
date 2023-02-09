import { RadixDappToolkit } from '../src/radix-dapp-toolkit'
import { Logger } from 'tslog'
import { html, render, LitElement, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { Persona, State } from '../src/_types'
import { Account } from '@radixdlt/connect-button'

const free_funds = (account_component_address: string) => `
  CALL_METHOD 
    ComponentAddress("component_tdx_22_1qgehpqdhhr62xh76wh6gppnyn88a0uau68epljprvj3s7s5gc3") 
    "free";
  
  CALL_METHOD
    ComponentAddress("${account_component_address}") 
    "deposit_batch"
    Expression("ENTIRE_WORKTOP");`

const update_metadata = (account_component_address: string) => `
  SET_METADATA 
    ComponentAddress("${account_component_address}") "name" "test name";   
  
  SET_METADATA
    ComponentAddress("${account_component_address}") "description" "test description";     

  SET_METADATA 
    ComponentAddress("${account_component_address}") "domain" "test.domain";     

  SET_METADATA
    ComponentAddress("${account_component_address}") "account_type" "dapp definition";`

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
  persona?: Persona

  private rdt = RadixDappToolkit(
    { dAppDefinitionAddress: 'acc_123abc', dAppName: 'Test dApp' },
    (requestData) => {
      requestData({
        accounts: { quantifier: 'atLeast', quantity: 1 },
      }).map(({ data: { accounts, persona } }) => {
        this.accounts = accounts
        this.persona = persona
      })
    },
    {
      logger: new Logger(),
      networkId: 34,
      onDisconnect: () => {
        this.accounts = []
        this.persona = undefined
      },
      onInit: ({ accounts, persona }) => {
        this.accounts = accounts ?? []
        this.persona = persona
      },
      explorer: {
        baseUrl: 'https://hammunet-dashboard.rdx-works-main.extratools.works/',
        accountsPath: 'account/',
        transactionPath: 'transaction/',
      },
    }
  )

  private sendTransactionTemplate() {
    return this.persona
      ? html`<radix-button
          fullWidth
          @click=${() => {
            this.rdt.sendTransaction({
              version: 1,
              transactionManifest: free_funds(this.accounts[0].address),
            })
          }}
        >
          Get free XRD
        </radix-button>`
      : html`<h2>Connect wallet to use dApp</h2>`
  }

  private oneTimeRequest() {
    return this.persona
      ? html`<radix-button
          fullWidth
          @click=${() => {
            this.rdt.requestData({
              accounts: { quantifier: 'atLeast', quantity: 1 },
            })
          }}
        >
          OneTimeRequest
        </radix-button>`
      : ''
  }

  private updateMetadata() {
    return this.persona
      ? html`<radix-button
          fullWidth
          @click=${() => {
            this.rdt.sendTransaction({
              version: 1,
              transactionManifest: update_metadata(this.accounts[0].address),
            })
          }}
        >
          Update metadata
        </radix-button>`
      : ''
  }

  private headerTemplate() {
    return html`<header>
      <h1>Example dApp</h1>
      <slot></slot>
    </header>`
  }

  render() {
    return html`<div>
      ${this.headerTemplate()}
      <div class="content">
        ${this.sendTransactionTemplate()} ${this.updateMetadata()}
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
