import { html, css, LitElement, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import { classMap } from 'lit/directives/class-map.js'
import './card'
import '../account/account'
import AvatarPlaceholder from '../../assets/avatar-placeholder.svg'

@customElement('radix-persona-card')
export class RadixPersonaCard extends LitElement {
  @property({
    type: String,
    reflect: true,
  })
  icon?: 'unchecked' | 'checked' | 'pending' | 'success' | 'error'

  @property({
    type: String,
  })
  persona: string = ''

  @property({
    type: String,
  })
  avatarUrl?: string

  @property({
    type: Array,
  })
  personaData: string[] = []

  render() {
    return html`<radix-card>
      <div
        class=${classMap({
          center: (this.personaData || []).length < 2,
          'persona-card': true,
        })}
      >
        <div class="placeholder">
          <div
            class=${classMap({
              avatar: !!this.avatarUrl,
            })}
            style=${styleMap({
              backgroundImage: `url(${unsafeCSS(this.avatarUrl)})`,
            })}
          ></div>
        </div>
        <div class="content">
          <span class="persona">${this.persona}</span>
          <ul>
            ${(this.personaData || []).map((item) => html`<li>${item}</li>`)}
          </ul>
        </div>
      </div></radix-card
    >`
  }

  static styles = [
    css`
      :host {
        display: flex;
        width: 100%;
      }

      .avatar {
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        align-self: center;
        border: 2px solid var(--radix-avatar-border-color);
      }

      .placeholder {
        width: 64px;
        height: 64px;
        background-image: url(${unsafeCSS(AvatarPlaceholder)});
      }

      .persona-card {
        display: grid;
        gap: 20px;
        align-items: flex-start;
        grid-template-columns: 1fr 230px;
      }

      .persona-card.center {
        align-items: center;
      }

      .persona {
        font-size: 14px;
        font-weight: 600;
        text-overflow: ellipsis;
        overflow: hidden;
        display: block;
        white-space: nowrap;
      }

      ul {
        margin-top: 5px;
        margin-bottom: 0;
        padding-inline-start: 20px;
      }

      li {
        font-size: 12px;
        word-break: break-word;
        line-height: 18px;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-persona-card': RadixPersonaCard
  }
}
