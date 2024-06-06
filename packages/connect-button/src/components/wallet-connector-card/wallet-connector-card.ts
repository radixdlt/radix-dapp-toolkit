import { html, css, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import logoGradient from '../../assets/logo-gradient.png'
@customElement('radix-wallet-connector-card')
export class RadixWalletConnectorCard extends LitElement {
  @property({
    type: String,
  })
  header: string = 'Radix Wallet Connector'

  render() {
    return html`
      <div class="radix-wallet-connector-card">
        <div class="radix-wallet-connector-card__logo">
          <img
            width="78"
            height="78"
            src=${logoGradient}
            alt="Radix Wallet Connector Logo"
          />
        </div>
        <div class="radix-wallet-connector-card__header">${this.header}</div>
        <slot></slot>
      </div>
    `
  }

  static styles = [
    css`
      .radix-wallet-connector-card {
        background: #fff;
        padding: 24px;
        border-radius: 16px;
        position: relative;
        margin-top: 60px;
        text-align: center;
        box-shadow: 0px 4px 7px 0px #00000040;
      }

      .radix-wallet-connector-card__logo {
        position: absolute;
        left: 0;
        right: 0;
      }

      .radix-wallet-connector-card__logo img {
        width: 78px;
        height: 78px;
        transform: translateY(-66px);
        box-shadow: 0 4px 10px 0 rgba(0, 0, 0, 0.25);
        border-radius: 16px;
      }

      .radix-wallet-connector-card__header {
        margin-top: 32px;
        margin-bottom: 24px;
        font-size: 18px;
        color: var(--color-grey-2);
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-wallet-connector-card': RadixWalletConnectorCard
  }
}
