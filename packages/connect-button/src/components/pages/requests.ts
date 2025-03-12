import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import '../card/request-cards'
import { RequestItem } from 'radix-connect-common'
import { pageStyles } from './styles'
import { formatTimestamp } from '../../helpers/format-timestamp'

@customElement('radix-requests-page')
export class RadixRequestsPage extends LitElement {
  @property({ type: Array })
  requestItems: RequestItem[] = []

  @property({
    type: String,
  })
  dAppName: string = ''

  @property({
    type: String,
  })
  loggedInTimestamp: string = ''

  render() {
    return html`
      <div class="header">Connected to ${this.dAppName || "dApp"}</div>
      <slot name="subheader"></slot>
      ${this.loggedInTimestamp
        ? html`<div class="subheader">
            Since logged in: ${formatTimestamp(this.loggedInTimestamp, ', ')}
          </div>`
        : ''}
      <div class="content">
        <radix-request-cards .requestItems=${this.requestItems}></radix-request-cards>
      </div>
    `
  }

  static styles = [
    pageStyles,
    css`
      .subheader {
        color: var(--radix-card-text-dimmed-color);
        margin-top: -12px;
        margin-bottom: 15px;
        text-align: center;
        font-size: 12px;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-requests-page': RadixRequestsPage
  }
}
