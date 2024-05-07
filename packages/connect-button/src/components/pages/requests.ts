import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import '../card/request-card'
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
      <div class="header">Connected to ${this.dAppName}</div>
      <slot name="subheader"></slot>
      ${this.loggedInTimestamp
        ? html`<div class="subheader">
            Since logged in: ${formatTimestamp(this.loggedInTimestamp, ', ')}
          </div>`
        : ''}
      <div class="content">
        ${(this.requestItems || []).map(
          (requestItem) =>
            html`<radix-request-card
              type="${requestItem.type}"
              status="${requestItem.status}"
              id="${requestItem.interactionId}"
              transactionIntentHash="${requestItem.transactionIntentHash || ''}"
              ?showCancel="${requestItem.showCancel}"
              @onCancel=${(event: any) => {
                this.dispatchEvent(
                  new CustomEvent('onCancel', {
                    detail: event.detail,
                    bubbles: true,
                    composed: true,
                  }),
                )
              }}
              timestamp=${requestItem.createdAt}
            ></radix-request-card>`,
        )}
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

      .content {
        padding-bottom: 25px;
        max-height: calc(100vh - 270px);
      }

      @media (min-height: 580px) {
        .content {
          max-height: 360px;
        }
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-requests-page': RadixRequestsPage
  }
}
