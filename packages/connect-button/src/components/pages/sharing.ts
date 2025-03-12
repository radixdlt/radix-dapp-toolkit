import { html, css, LitElement, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { Account } from 'radix-connect-common'
import '../account/account'
import '../card/persona-card'
import '../popover/popover'
import '../tabs-menu/tabs-menu'
import '../themed-button/themed-button'
import RefreshIcon from '../../assets/refresh.svg'
import LogoutIcon from '../../assets/logout.svg'
import { pageStyles } from './styles'
import { classMap } from 'lit/directives/class-map.js'

@customElement('radix-sharing-page')
export class RadixSharingPage extends LitElement {
  @property({
    type: String,
  })
  avatarUrl: string = ''

  @property({
    type: String,
  })
  persona: string = ''

  @property({
    type: String,
  })
  dAppName: string = ''

  @property({
    type: Array,
  })
  personaData: string[] = []

  @property({
    type: Array,
  })
  accounts: Account[] = []

  private onUpdateData(event: MouseEvent) {
    this.dispatchEvent(
      new CustomEvent('onUpdateData', {
        detail: event,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private onLogout(event: MouseEvent) {
    this.dispatchEvent(
      new CustomEvent('onLogout', {
        detail: event,
        bubbles: true,
        composed: true,
      }),
    )
  }

  render() {
    return html` <div class="header">Sharing with ${this.dAppName || "dApp"}</div>
      <div class="content">
        <radix-persona-card
          avatarUrl=${this.avatarUrl}
          persona=${this.persona}
          .personaData=${this.personaData}
        ></radix-persona-card>
        <div>
          ${(this.accounts || []).map(
            ({ label, address, appearanceId }) =>
              html`<radix-account
                label=${label}
                address=${address}
                appearanceId=${appearanceId}
              ></radix-account>`,
          )}
        </div>
      </div>
      <div class="buttons">
        <radix-themed-button
          class=${classMap({
            full: true,
            disabled: this.accounts?.length === 0,
          })}
          @click=${this.onUpdateData}
        >
          <div
            class=${classMap({
              icon: true,
              'update-data': true,
              disabled: this.accounts?.length === 0,
            })}
          ></div>
          Update Account Sharing
        </radix-themed-button>
        <radix-themed-button class="full" @click=${this.onLogout}>
          <div class="icon logout"></div>
          Log Out
        </radix-themed-button>
      </div>`
  }

  static styles = [
    pageStyles,
    css`
      :host {
        width: 100%;
      }
      .icon::before {
        content: '';
        -webkit-mask-position: center;
        mask-position: center;
        -webkit-mask-size: cover;
        mask-size: cover;
        background: var(--radix-button-text-color);
        display: block;
        width: 20px;
        height: 20px;
      }
      .icon.disabled::before {
        background: var(--radix-button-disabled-text-color);
      }
      .buttons {
        display: grid;
        bottom: 0;
        width: 100%;
        grid-template-columns: 1fr 115px;
        grid-gap: 10px;
        width: 100%;
        padding-top: 10px;
        align-items: end;
      }

      .update-data::before {
        -webkit-mask-image: url(${unsafeCSS(RefreshIcon)});
        mask-image: url(${unsafeCSS(RefreshIcon)});
      }

      .logout::before {
        -webkit-mask-image: url(${unsafeCSS(LogoutIcon)});
        mask-image: url(${unsafeCSS(LogoutIcon)});
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-sharing-page': RadixSharingPage
  }
}
