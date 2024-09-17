import { html, css, LitElement, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import UncheckedIcon from '../../assets/unchecked.svg'
import CheckedIcon from '../../assets/checked.svg'
import IconLoading from '../../assets/icon-loading.svg'
import IconFailed from '../../assets/icon-failed.svg'
import IconIgnored from '../../assets/icon-ignored.svg'
import { formatTimestamp } from '../../helpers/format-timestamp'

@customElement('radix-card')
export class RadixCard extends LitElement {
  @property({
    type: String,
    reflect: true,
  })
  icon?: 'unchecked' | 'checked' | 'pending' | 'success' | 'error' | 'ignored'

  @property({
    type: String,
  })
  header: string = ''

  @property({
    type: String,
    reflect: true,
  })
  timestamp?: string

  render() {
    const renderDate = () =>
      this.timestamp
        ? html`<div class="timestamp">${formatTimestamp(this.timestamp)}</div>`
        : ''

    const gridTemplateColumns = `${this.icon ? '30px' : ''} 1fr ${
      this.timestamp ? '42px' : ''
    }`

    return html`<div class="card" style=${styleMap({ gridTemplateColumns })}>
      <i></i>
      <div class="content">
        <span>${this.header}</span>
        <slot></slot>
      </div>
      ${renderDate()}
    </div>`
  }

  static styles = [
    css`
      :host {
        background-color: var(--radix-card-background);
        color: var(--radix-card-text-color);
        display: block;
        padding: 11px 20px;
        user-select: none;
        border-radius: 12px;
        width: 100%;
        box-sizing: border-box;
      }

      :host(.inverted) {
        background-color: var(--radix-card-inverted-background);
        color: var(--radix-card-inverted-text-color);
      }

      :host(.inverted) .card i::before {
        background-color: var(--radix-card-inverted-text-color);
      }

      :host(.dimmed) .card i::before {
        background-color: var(--radix-card-text-dimmed-color);
      }

      :host(.dimmed) .content {
        color: var(--radix-card-text-dimmed-color);
      }

      .timestamp {
        text-align: right;
        color: var(--radix-card-text-dimmed-color);
        font-size: 12px;
      }

      .card {
        display: grid;
        align-items: center;
        column-gap: 10px;
      }

      i::before {
        content: '';
        display: block;
        -webkit-mask-size: cover;
        mask-size: cover;
        background-color: var(--radix-card-text-color);
      }

      span {
        display: block;
        font-weight: 600;
        font-size: 14px;
      }

      p {
        margin: 0;
      }

      :host([icon='unchecked']) i::before {
        -webkit-mask-image: url(${unsafeCSS(UncheckedIcon)});
        mask-image: url(${unsafeCSS(UncheckedIcon)});
        width: 24px;
        height: 24px;
      }

      :host([icon='pending']) i::before {
        -webkit-mask-image: url(${unsafeCSS(IconLoading)});
        mask-image: url(${unsafeCSS(IconLoading)});
        width: 24px;
        height: 24px;
        transform-origin: center;
        animation: spinner 0.75s infinite linear;
      }
      
      @keyframes spinner {
        100% {
          transform: rotate(360deg);
        }
      }

      :host([icon='ignored']) i::before {
        -webkit-mask-image: url(${unsafeCSS(IconIgnored)});
        mask-image: url(${unsafeCSS(IconIgnored)});
        width: 24px;
        height: 24px;
      }

      :host([icon='checked']) i::before {
        -webkit-mask-image: url(${unsafeCSS(CheckedIcon)});
        mask-image: url(${unsafeCSS(CheckedIcon)});
        width: 24px;
        height: 24px;
      }

      :host([icon='error']) i::before {
        -webkit-mask-image: url(${unsafeCSS(IconFailed)});
        mask-image: url(${unsafeCSS(IconFailed)});
        width: 24px;
        height: 24px;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-card': RadixCard
  }
}
