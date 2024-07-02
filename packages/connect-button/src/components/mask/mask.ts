import { html, css, LitElement, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import MaskGradient from '../../assets/mask-gradient.svg'

@customElement('radix-mask')
export class RadixMask extends LitElement {
  @property({
    type: Boolean,
    reflect: true,
  })
  isBranded = false

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
        padding: 16px;
        box-sizing: border-box;
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 200ms;
        background: var(--radix-mask-background);
        z-index: 2147483647;
      }

      :host([isBranded]) {
        align-items: flex-start;
        background: #000;
        background-image: url(${unsafeCSS(MaskGradient)});
        background-size: cover;
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
