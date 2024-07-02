import { html, css, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('radix-themed-button')
export class RadixThemedButton extends LitElement {
  render() {
    return html` <button><slot></slot></button> `
  }

  static styles = [
    css`
      button {
        transition: background-color 0.1s cubic-bezier(0.45, 0, 0.55, 1);
        border-radius: 12px;
        border: none;
        background: var(--radix-button-background);
        color: var(--radix-button-text-color);
        font-size: 14px;
        font-weight: 600;
        padding: 11px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
      }

      button:hover {
        background: var(--radix-button-background-hover);
      }

      button:active {
        background: var(--radix-button-background-pressed);
      }

      :host(.primary) button {
        background: var(--color-radix-blue-2);
        color: var(--color-light);
      }

      :host(.full) button {
        width: 100%;
      }

      :host(.primary.disabled) button,
      :host(.disabled) button {
        background: var(--radix-button-disabled-background);
        color: var(--radix-button-disabled-text-color);
        cursor: default;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-themed-button': RadixThemedButton
  }
}
