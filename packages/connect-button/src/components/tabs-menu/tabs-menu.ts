import { html, css, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

@customElement('radix-tabs-menu')
export class RadixTabsMenu extends LitElement {
  @property({
    type: String,
    reflect: true,
  })
  active: 'sharing' | 'requests' = 'sharing'

  private onClick(value: 'sharing' | 'requests', event: MouseEvent) {
    this.dispatchEvent(
      new CustomEvent('onClick', {
        detail: { value, event },
        bubbles: true,
        composed: true,
      }),
    )
  }

  render() {
    return html`
      <div class="tabs">
        <button
          @click=${(event: MouseEvent) => this.onClick('sharing', event)}
          class=${classMap({
            active: this.active === 'sharing',
          })}
        >
          Sharing
        </button>
        <button
          @click=${(event: MouseEvent) => this.onClick('requests', event)}
          class=${classMap({
            active: this.active === 'requests',
          })}
        >
          Requests
        </button>
        <div class="active-indicator"></div>
      </div>
    `
  }

  static styles = [
    css`
      :host {
        display: block;
        width: 100%;
        user-select: none;
      }

      .tabs {
        width: calc(100% - 10px);
        display: grid;
        grid-template-columns: 1fr 1fr;
        justify-content: space-between;
        padding: 5px;
        border-radius: 12px;
        position: relative;
        background: var(--radix-popover-tabs-background);
      }

      button {
        border: unset;
        font-size: 14px;
        background: transparent;
        text-align: center;
        flex: 1;
        border-radius: 8px;
        font-weight: 600;
        color: var(--radix-popover-text-color);
        width: 100%;
        height: 32px;
        z-index: 1;
        margin: 0;
        padding: 0;
      }

      button:not(.active) {
        cursor: pointer;
      }

      .active-indicator {
        width: calc(50% - 5px);
        height: 32px;
        border-radius: 8px;
        position: absolute;
        box-shadow: 0px 4px 5px 0px #0000001a;
        background: var(--radix-popover-tabs-button-active-background);
        top: 5px;
        transition: transform 0.125s cubic-bezier(0.45, 0, 0.55, 1);
      }

      :host([active='sharing']) .active-indicator {
        transform: translateX(5px);
      }

      :host([active='requests']) .active-indicator {
        transform: translateX(calc(100% + 5px));
      }

      button:focus,
      button:focus-visible {
        outline: 0px auto -webkit-focus-ring-color;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-tabs-menu': RadixTabsMenu
  }
}
