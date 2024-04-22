import { html, css, LitElement, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import CopyIcon from '../../assets/copy.svg'
import { shortenAddress } from '../../helpers/shorten-address'
import { classMap } from 'lit/directives/class-map.js'

@customElement('radix-account')
export class RadixAccount extends LitElement {
  @property({
    type: String,
  })
  address = ''

  @property({
    type: String,
  })
  label = ''

  @property({
    type: Number,
    reflect: true,
  })
  appearanceId: number = 0

  @state()
  private tooltipVisible = false

  @state()
  private setTimeoutInstance: ReturnType<typeof setTimeout> | undefined

  private copiedTooltipTimeout = 1500

  disconnectedCallback() {
    if (this.setTimeoutInstance) {
      clearTimeout(this.setTimeoutInstance)
    }
    super.disconnectedCallback()
  }

  render() {
    return html` <span class="label">${this.label}</span>
      <a
        class="address"
        target="_blank"
        href=${`${this.address}`}
        @click=${(event: MouseEvent) => {
          event.preventDefault()
          this.dispatchEvent(
            new CustomEvent('onLinkClick', {
              bubbles: true,
              composed: true,
              detail: { type: 'account', data: this.address },
            }),
          )
        }}
      >
        ${shortenAddress(this.address)}
        <button
          aria-label="Copied!"
          class=${classMap({
            'tooltip-wrapper': true,
            'tooltip-visible': this.tooltipVisible,
          })}
        >
          <i
            @click=${(ev: MouseEvent) => {
              ev.preventDefault()
              ev.stopImmediatePropagation()
              navigator.clipboard.writeText(this.address)
              this.tooltipVisible = true
              this.setTimeoutInstance = setTimeout(() => {
                this.tooltipVisible = false
              }, this.copiedTooltipTimeout)
            }}
          ></i>
        </button>
      </a>`
  }

  static styles = [
    css`
      :host {
        display: flex;
        width: 100%;
        box-sizing: border-box;
        justify-content: space-between;
        margin-top: 0.5rem;
        border-radius: 12px;
        color: var(--color-light);
        font-size: 14px;
        height: 40px;
        align-items: center;
        padding: 0 20px;
      }

      .tooltip-wrapper {
        all: unset;
        display: inline-flex;
        position: relative;
      }

      .tooltip-wrapper::after,
      .tooltip-wrapper::before {
        transition: opacity 0.1s ease-out 0.2s;
      }

      .tooltip-wrapper::after {
        background: #000;
        color: #fff;
        border-radius: 8px;
        content: attr(aria-label);
        padding: 0.5rem 1rem;
        position: absolute;
        white-space: nowrap;
        z-index: 10;
        opacity: 0;
        pointer-events: none;
        transform: translate(-70%, -30%);
        bottom: 100%;
      }

      .tooltip-wrapper::before {
        content: '';
        position: absolute;
        z-index: 10;
        opacity: 0;
        pointer-events: none;
        width: 0;
        height: 0;
        border: 8px solid transparent;
        border-top-color: #000;
        transform: translate(-15%, 25%);
        bottom: 100%;
      }

      .tooltip-wrapper.tooltip-visible::after,
      .tooltip-wrapper.tooltip-visible::before {
        opacity: 1;
      }

      .label {
        font-weight: 600;
        color: var(--color-light);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-right: 10px;
      }

      a {
        color: var(--color-light);
        display: flex;
        align-items: center;
        gap: 4px;
        opacity: 0.8;
        font-size: 12px;
      }

      i {
        background-image: url(${unsafeCSS(CopyIcon)});
        display: inline-block;
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center bottom;
        width: 13px;
        height: 13px;
      }

      .label,
      a,
      i {
        text-shadow: 0px 4px 3px rgba(0, 0, 0, 0.08);
      }

      :host([appearanceId='0']) {
        background: linear-gradient(276.58deg, #01e2a0 -0.6%, #052cc0 102.8%);
      }

      :host([appearanceId='1']) {
        background: linear-gradient(
          276.33deg,
          #ff43ca -14.55%,
          #052cc0 102.71%
        );
      }

      :host([appearanceId='2']) {
        background: linear-gradient(
          276.33deg,
          #20e4ff -14.55%,
          #052cc0 102.71%
        );
      }

      :host([appearanceId='3']) {
        background: linear-gradient(94.8deg, #00ab84 -1.2%, #052cc0 103.67%);
      }

      :host([appearanceId='4']) {
        background: linear-gradient(94.62deg, #ce0d98 -10.14%, #052cc0 104.1%);
      }

      :host([appearanceId='5']) {
        background: linear-gradient(
          276.33deg,
          #052cc0 -14.55%,
          #0dcae4 102.71%
        );
      }

      :host([appearanceId='6']) {
        background: linear-gradient(90.89deg, #003057 -2.21%, #03d597 102.16%);
      }

      :host([appearanceId='7']) {
        background: linear-gradient(276.23deg, #f31dbe -2.1%, #003057 102.67%);
      }

      :host([appearanceId='8']) {
        background: linear-gradient(276.48deg, #003057 -0.14%, #052cc0 102.77%);
      }

      :host([appearanceId='9']) {
        background: linear-gradient(276.32deg, #1af4b5 -5.15%, #0ba97d 102.7%);
      }

      :host([appearanceId='10']) {
        background: linear-gradient(276.23deg, #e225b3 -2.1%, #7e0d5f 102.67%);
      }

      :host([appearanceId='11']) {
        background: linear-gradient(276.48deg, #1f48e2 -0.14%, #040b72 102.77%);
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-account': RadixAccount
  }
}
