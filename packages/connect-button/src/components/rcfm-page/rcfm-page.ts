import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import '../mask/mask'
import '../wallet-connector-card/wallet-connector-card'
import '../wallet-connector-card/wallet-connector-info'
import '../loading-spinner/loading-spinner'

@customElement('radix-rcfm-page')
export class RadixRcfmPage extends LitElement {
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

  @property({
    type: Boolean,
  })
  isLoading: boolean = false

  @property({
    type: Boolean,
  })
  isHidden: boolean = true

  render() {
    if (this.isHidden) {
      return html``
    }

    return html` <radix-mask isBranded>
      <radix-wallet-connector-card>
        ${this.isLoading
          ? html`<div class="loading-container">
              <radix-loading-spinner></radix-loading-spinner>
            </div>`
          : html`<radix-wallet-connector-info
              header=${this.header}
              subheader=${this.subheader}
              ?isError=${this.isError}
            ></radix-wallet-connector-info>`}
      </radix-wallet-connector-card>
    </radix-mask>`
  }

  static styles = [
    css`
      .loading-container {
        display: flex;
        justify-content: center;
        padding: 18px 0;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-rcfm-page': RadixRcfmPage
  }
}
