import { styleMap } from 'lit/directives/style-map.js'
import { LitElement, css, html } from 'lit'
import { BUTTON_MIN_WIDTH } from '../../constants'
import { customElement, property } from 'lit/decorators.js'

export const LoadingSpinner = html`<div class="loading-spinner-container">
  <div class="loading-spinner"></div>
</div>`

export const loadingSpinnerCSS = css`
  .loading-spinner-container {
    display: flex;
  }

  @container (max-width: ${BUTTON_MIN_WIDTH - 16}px) {
    .loading-spinner-container {
      margin-left: 0;
      margin-right: 0;
    }
  }

  button.gradient > .loading-spinner {
    border-right-color: var(--color-light);
    border-left-color: color-mix(in srgb, var(--color-light) 30%, transparent);
    border-top-color: color-mix(in srgb, var(--color-light) 30%, transparent);
    border-bottom-color: color-mix(
      in srgb,
      var(--color-light) 30%,
      transparent
    );
  }

  .loading-spinner {
    width: 22px;
    height: 22px;
    min-width: 22px;
    min-height: 22px;
    border: 2px solid var(--radix-connect-button-text-color);
    border-left-color: color-mix(
      in srgb,
      var(--radix-connect-button-text-color) 30%,
      transparent
    );
    border-top-color: color-mix(
      in srgb,
      var(--radix-connect-button-text-color) 30%,
      transparent
    );
    border-bottom-color: color-mix(
      in srgb,
      var(--radix-connect-button-text-color) 30%,
      transparent
    );
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
    align-self: center;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`

@customElement('radix-loading-spinner')
export class RadixLoadingSpinner extends LitElement {
  @property({
    type: Number,
  })
  size: number = 48

  @property({
    type: Number,
  })
  weight: number = 5

  @property({
    type: String,
  })
  color: string = 'var(--color-grey-2)'

  static styles = [
    css`
      .loading-spinner-container {
        display: flex;
      }

      .loading-spinner {
        border-radius: 50%;
        display: inline-block;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
        align-self: center;
      }

      @keyframes rotation {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ]

  render() {
    return html`<div class="loading-spinner-container">
      <div
        class="loading-spinner"
        style=${styleMap({
          width: `${this.size}px`,
          height: `${this.size}px`,
          minWidth: `${this.size}px`,
          minHeight: `${this.size}px`,
          border: `${this.weight}px solid color-mix(in srgb, ${this.color} 30%, transparent)`,
          borderBottomColor: this.color,
        })}
      ></div>
    </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-loading-spinner': RadixLoadingSpinner
  }
}
