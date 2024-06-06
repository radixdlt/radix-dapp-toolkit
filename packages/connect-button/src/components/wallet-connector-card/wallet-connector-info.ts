import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import IconWarning from '../../assets/icon-warning.svg'
import { classMap } from 'lit/directives/class-map.js'

@customElement('radix-wallet-connector-info')
export class RadixWalletConnectorInfo extends LitElement {
  @property({
    type: String,
  })
  header: string = ''

  @property({
    type: String,
  })
  subheader: string = ''

  @property({
    type: Boolean,
  })
  isError: boolean = false

  render() {
    return html`
      <div class="connector-error">
        ${this.isError
          ? html`<img src="${IconWarning}" alt="Warning" width="33" />`
          : ''}

        <h1 class=${classMap({ error: this.isError })}>${this.header}</h1>
        ${this.subheader ? html`<h3>${this.subheader}</h3>` : ''}
      </div>
    `
  }

  static styles = [
    css`
      .connector-error {
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 16px;
      }
      h1 {
        font-size: 24px;
        font-weight: 700;
        margin: 0;
      }

      .error {
        color: #f00000;
      }

      h3 {
        margin: 0;
        color: var(--color-grey-2);
        font-size: 16px;
        font-weight: 500;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-wallet-connector-info': RadixWalletConnectorInfo
  }
}
