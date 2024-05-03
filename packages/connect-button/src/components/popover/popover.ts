import { html, css, LitElement, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { themeCSS } from '../../theme'
import '../tabs-menu/tabs-menu'
import { encodeBase64 } from '../../helpers/encode-base64'
import CloseIcon from '../../assets/icon-close.svg'

@customElement('radix-popover')
export class RadixPopover extends LitElement {
  @property({
    type: Boolean,
  })
  connected = false

  @property({
    type: Boolean,
  })
  compact = false

  @property({
    type: Boolean,
    reflect: true,
  })
  modal = false

  @property({
    type: Boolean,
    reflect: true,
  })
  showCloseButton = false

  closePopover() {
    this.dispatchEvent(
      new CustomEvent('onClosePopover', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  svgBorder = `data:image/svg+xml;base64,${encodeBase64(`<svg width="352" height="352" viewBox="0 0 352 352" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1.5H339V0.5H13V1.5ZM350.5 13V339H351.5V13H350.5ZM339 350.5H13V351.5H339V350.5ZM1.5 339V13H0.5V339H1.5ZM13 350.5C6.64873 350.5 1.5 345.351 1.5 339H0.5C0.5 345.904 6.09644 351.5 13 351.5V350.5ZM350.5 339C350.5 345.351 345.351 350.5 339 350.5V351.5C345.904 351.5 351.5 345.904 351.5 339H350.5ZM339 1.5C345.351 1.5 350.5 6.64873 350.5 13H351.5C351.5 6.09644 345.904 0.5 339 0.5V1.5ZM13 0.5C6.09644 0.5 0.5 6.09644 0.5 13H1.5C1.5 6.64873 6.64873 1.5 13 1.5V0.5Z" fill="url(#gradient)"/><defs><linearGradient id="gradient" x1="340.017" y1="27.6666" x2="36.936" y2="352.447" gradientUnits="userSpaceOnUse"><stop stop-color="#CE0D98"/><stop offset="0.210873" stop-color="#052CC0"/><stop offset="0.479167" stop-color="#20E4FF"/><stop offset="0.729604" stop-color="#052CC0"/><stop offset="1" stop-color="#21FFBE"/></linearGradient></defs></svg>`)}`

  private closeButton() {
    return html`<button
      id="close-button"
      @click=${() => {
        this.closePopover()
      }}
    ></button>`
  }

  render() {
    return html`
      <style>
        :host([connected]) {
          border-image: url(${this.svgBorder}) 10/10px stretch;
          border-image-outset: 1px;
        }
      </style>
      <div id="radix-popover-content">
        ${this.showCloseButton ? this.closeButton() : ''}
        <slot></slot>
      </div>
    `
  }

  static styles = [
    themeCSS,
    css`
      :host {
        user-select: none;
        display: inline-flex;
        background-position: center top;
        background-repeat: no-repeat;
        justify-content: center;
        align-items: flex-start;
        background: var(--radix-popover-background);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        box-sizing: border-box;
        max-height: 100vh;
        border-radius: 12px;
        padding: 12px;
        border: 1px solid var(--radix-popover-border-color);
        box-shadow: 0px 11px 35px 0px #00000047;
      }

      :host([isMobile]) {
        max-width: 100%;
      }

      #radix-popover-content {
        width: 344px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        flex-direction: column;
        overflow: auto;
      }

      #close-button {
        -webkit-mask-image: url(${unsafeCSS(CloseIcon)});
        mask-image: url(${unsafeCSS(CloseIcon)});
        background-color: var(--radix-card-text-color);
        width: 24px;
        height: 24px;
        background-repeat: no-repeat;
        align-self: flex-start;
        margin-bottom: 10px;
        cursor: pointer;
      }

      #close-button:hover {
        opacity: 0.8;
      }

      @-webkit-keyframes slide-bottom {
        0% {
          -webkit-transform: translateY(-10px);
          transform: translateY(-10px);
          opacity: 0;
        }
        100% {
          -webkit-transform: translateY(0px);
          transform: translateY(0px);
          opacity: 1;
        }
      }
      @keyframes slide-bottom {
        0% {
          -webkit-transform: translateY(-10px);
          transform: translateY(-10px);
          opacity: 0;
        }
        100% {
          -webkit-transform: translateY(0px);
          transform: translateY(0px);
          opacity: 1;
        }
      }

      @-webkit-keyframes slide-up {
        0% {
          -webkit-transform: translateY(0px);
          transform: translateY(0px);
          opacity: 1;
        }
        100% {
          -webkit-transform: translateY(-10px);
          transform: translateY(-10px);
          opacity: 0;
        }
      }
      @keyframes slide-up {
        0% {
          -webkit-transform: translateY(0px);
          transform: translateY(0px);
          opacity: 1;
        }
        100% {
          -webkit-transform: translateY(-10px);
          transform: translateY(-10px);
          opacity: 0;
        }
      }

      :host(.hide) {
        pointer-events: none;
        -webkit-animation: slide-up 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)
          both;
        animation: slide-up 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
      }
      :host(.show) {
        -webkit-animation: slide-bottom 0.2s
          cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        animation: slide-bottom 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-popover': RadixPopover
  }
}
