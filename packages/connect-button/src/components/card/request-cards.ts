import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { themeCSS } from '../../theme'
import '../card/request-card'
import { RequestItem } from 'radix-connect-common'

@customElement('radix-request-cards')
export class RadixRequestCards extends LitElement {
  @property({ type: Array })
  requestItems: RequestItem[] = []

  render() {
    return (this.requestItems || []).map(
      (requestItem) =>
        html`<radix-request-card
          type="${requestItem.type}"
          status="${requestItem.status}"
          id="${requestItem.interactionId}"
          ?showCancel="${requestItem.showCancel}"
          timestamp=${requestItem.createdAt}
        ></radix-request-card>`,
    )
  }

  static styles = [themeCSS]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-request-cards': RadixRequestCards
  }
}
