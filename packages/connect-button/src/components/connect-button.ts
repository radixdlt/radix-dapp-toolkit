import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import './popover/popover'
import './button/button'
import './card/card'
import './link/link'
import './pages/not-connected'
import './pages/sharing'
import './mask/mask'
import './pages/requests'
import {
  Account,
  PersonaData,
  RadixButtonStatus,
  RadixButtonTheme,
  RequestItem,
} from 'radix-connect-common'
import { classMap } from 'lit-html/directives/class-map.js'
import { themeCSS, variablesCSS } from '../theme'

@customElement('radix-connect-button')
export class ConnectButton extends LitElement {
  @property({
    type: String,
  })
  theme: RadixButtonTheme = 'radix-blue'

  @property({ type: String })
  dAppName: string = ''

  @property({ type: String })
  personaLabel: string = ''

  @property({ type: Boolean })
  connected = false

  @property({
    type: String,
  })
  status: RadixButtonStatus = RadixButtonStatus.default

  @property({ type: String })
  loggedInTimestamp: string = ''

  @property({ type: Boolean })
  showPopoverMenu: boolean = false

  @property({ type: Array })
  requestItems: RequestItem[] = []

  @property({ type: Array })
  accounts: Account[] = []

  @property({
    type: Array,
  })
  personaData: PersonaData[] = []

  @property({
    type: Boolean,
  })
  isMobile: boolean = false

  @property({
    type: Boolean,
  })
  enableMobile: boolean = false

  @property({
    type: Boolean,
  })
  isWalletLinked: boolean = false

  @property({
    type: Boolean,
  })
  isExtensionAvailable: boolean = false

  @property({
    type: Boolean,
  })
  fullWidth: boolean = false

  @property({
    type: String,
  })
  activeTab: 'sharing' | 'requests' = 'sharing'

  @property({ type: String, reflect: true })
  mode: 'light' | 'dark' = 'light'

  @property({ type: String })
  avatarUrl: string = ''

  @property({ type: Boolean, state: true })
  compact = false

  @property({
    type: Boolean,
  })
  showLinking: boolean = false

  get hasSharedData(): boolean {
    return !!(this.accounts.length || this.personaData.length)
  }

  pristine = true

  windowClickEventHandler: (event: MouseEvent) => void

  attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null,
  ): void {
    super.attributeChangedCallback(name, _old, value)
    if (name === 'showpopovermenu') {
      this.pristine = false
    }
  }

  private readonly fontGoogleApiHref =
    'https://fonts.googleapis.com/css?family=IBM+Plex+Sans:400,600'

  constructor() {
    super()
    this.injectFontCSS()
    this.windowClickEventHandler = (event) => {
      if (!this.showPopoverMenu) return
      if (this.contains(event.target as HTMLElement)) return
      this.showPopoverMenu = false
    }
    document.addEventListener('click', this.windowClickEventHandler)
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.dispatchEvent(
      new CustomEvent('onRender', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  disconnectedCallback(): void {
    document.removeEventListener('click', this.windowClickEventHandler)
    this.dispatchEvent(
      new CustomEvent('onDestroy', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private injectFontCSS() {
    if (this.shouldSkipFontInjection()) {
      return
    }

    const link = document.createElement('link')
    link.setAttribute('rel', 'stylesheet')
    link.setAttribute('href', this.fontGoogleApiHref)
    document.head.append(link)
  }

  private shouldSkipFontInjection(): boolean {
    return (
      !!document.head.querySelector(
        `link[href|="${this.fontGoogleApiHref}"]`,
      ) || document.fonts.check('16px IBM Plex Sans')
    )
  }

  private togglePopoverMenu() {
    this.pristine = false
    this.showPopoverMenu = !this.showPopoverMenu
    if (this.showPopoverMenu)
      this.dispatchEvent(
        new CustomEvent('onShowPopover', {
          bubbles: true,
          composed: true,
        }),
      )
  }

  private closePopover() {
    this.showPopoverMenu = false
  }

  private connectButtonTemplate() {
    const buttonText = this.connected ? this.personaLabel : 'Connect'

    return html` <radix-button
      status=${this.status}
      theme=${this.theme}
      ?connected=${this.connected}
      ?fullWidth=${this.fullWidth}
      @onClick=${this.togglePopoverMenu}
      @onResize=${(event: CustomEvent) => {
        this.compact = event.detail.offsetWidth === 40
      }}
      ><div>${buttonText}</div></radix-button
    >`
  }

  private connectTemplate() {
    if (this.connected) {
      return
    }

    return html` <radix-not-connected-page
      status=${this.status}
      ?isMobile=${this.isMobile}
      .requestItems=${this.requestItems}
      ?isWalletLinked=${this.isWalletLinked}
      ?isExtensionAvailable=${this.isExtensionAvailable}
    >
    </radix-not-connected-page>`
  }

  private renderSharingTemplate() {
    return html` <radix-sharing-page
      dAppName=${this.dAppName}
      avatarUrl=${this.avatarUrl}
      persona=${this.personaLabel}
      .personaData=${(this.personaData || []).map((data) => data.value)}
      .accounts=${this.accounts}
      @onLogout=${() => {
        this.dispatchEvent(
          new CustomEvent('onDisconnect', {
            bubbles: true,
            composed: true,
          }),
        )
      }}
      @onUpdateData=${() => {
        this.dispatchEvent(
          new CustomEvent('onUpdateSharedData', {
            bubbles: true,
            composed: true,
          }),
        )
      }}
    ></radix-sharing-page>`
  }

  private renderRequestItemsTemplate() {
    return html` <radix-requests-page
      loggedInTimestamp=${this.loggedInTimestamp}
      dAppName=${this.dAppName}
      .requestItems=${this.requestItems}
    ></radix-requests-page>`
  }

  private get showComingSoonTemplate() {
    return this.isMobile && !this.enableMobile
  }

  private get showLinkingTemplate() {
    return this.isMobile && this.showLinking
  }

  private get showPopoverCloseButton() {
    return this.isMobile && !this.showLinking
  }

  private popoverTemplate() {
    if (this.pristine) return ''

    return html` <radix-popover
      ?connected=${this.connected}
      ?compact=${this.compact}
      ?showCloseButton=${this.showPopoverCloseButton}
      @onClosePopover=${() => {
        this.closePopover()
      }}
      class=${classMap({
        show: this.showPopoverMenu,
        hide: !this.showPopoverMenu,
        popoverPosition: !this.isMobile,
      })}
    >
      ${this.showComingSoonTemplate
        ? this.renderComingSoonTemplate()
        : this.showLinkingTemplate
          ? this.renderLinkingTemplate()
          : this.renderPopoverContentTemplate()}
    </radix-popover>`
  }

  private renderPopoverContentTemplate() {
    return this.connected
      ? html`
          <radix-tabs-menu
            active=${this.activeTab}
            @onClick="${(event: CustomEvent) => {
              this.activeTab = event.detail.value
            }}"
          ></radix-tabs-menu>

          ${this.activeTab === 'sharing'
            ? this.renderSharingTemplate()
            : this.renderRequestItemsTemplate()}
        `
      : this.connectTemplate()
  }

  private renderComingSoonTemplate() {
    return html` <div class="mobile-wrapper">
      <div class="header">Mobile dApps are coming soon.</div>
      <div class="content">
        For now, please connect to Radix dApps using a desktop web browser.
      </div>
    </div>`
  }

  private renderLinkingTemplate() {
    return html` <div class="mobile-wrapper">
      <div class="header">dApp Verified</div>
      <div class="content">
        You can close this tab and return to where you left off.
      </div>
    </div>`
  }

  render() {
    return html`
      ${this.connectButtonTemplate()}
      ${this.isMobile
        ? html` <radix-mask
            class=${classMap({
              show: this.showPopoverMenu,
              hide: !this.showPopoverMenu,
            })}
          >
            ${this.popoverTemplate()}
          </radix-mask>`
        : this.popoverTemplate()}
    `
  }

  static styles = [
    variablesCSS,
    themeCSS,
    css`
      :root {
        font-family: 'IBM Plex Sans';
        margin: 0;
        font-size: 16px;
        line-height: 24px;
        font-weight: 400;

        color-scheme: light dark;
        color: rgba(255, 255, 255, 0.87);

        font-synthesis: none;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -webkit-text-size-adjust: 100%;
      }

      :host {
        text-align: left;
        font-family: 'IBM Plex Sans';
        position: relative;
        z-index: 2147483647;
        display: inline-block;
      }

      .mobile-wrapper {
        display: flex;
        flex-direction: column;
        text-align: center;

        align-items: center;
        margin-bottom: 18px;
        margin-top: 25px;
        font-size: 14px;
      }

      .mobile-wrapper .header {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 5px;
      }
      .mobile-wrapper .content {
        font-size: 16px;
        margin-bottom: 5px;
      }

      .popoverPosition {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-connect-button': ConnectButton
  }
}
