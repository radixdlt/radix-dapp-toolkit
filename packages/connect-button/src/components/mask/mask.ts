import { html, css, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('radix-mask')
export class RadixMask extends LitElement {
  render() {
    return html`<slot></slot>`
  }

  static styles = [
    css`
      :host {
        position: fixed;
        top: 0;
        left: 0;
        right: unset;
        height: 100%;
        width: 100%;
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 200ms;
        background: var(--radix-mask-background);
      }

      :host(.hide) {
        opacity: 0;
        pointer-events: none;
      }

      :host(.show) {
        opacity: 1;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-mask': RadixMask
  }
}
