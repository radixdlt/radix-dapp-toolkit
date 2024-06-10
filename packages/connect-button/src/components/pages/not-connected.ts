import { html, css, LitElement, TemplateResult } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import logoGradient from '../../assets/logo-gradient.png'
import {
  BrowserHandling,
  RadixButtonStatus,
  RequestItem,
} from 'radix-connect-common'
import { classMap } from 'lit/directives/class-map.js'
import '../card/request-cards'
import '../themed-button/themed-button'
@customElement('radix-not-connected-page')
export class RadixNotConnectedPage extends LitElement {
  @property({
    type: Boolean,
  })
  isMobile: boolean = false

  @property({
    type: String,
  })
  status: RadixButtonStatus = RadixButtonStatus.default

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
  isInAppBrowser: boolean = false

  @property({
    type: Boolean,
  })
  showCloseButton: boolean = false

  @property({
    type: Boolean,
  })
  isUnsupportedBrowser: boolean = false

  @property({ type: String })
  inAppBrowserHandling: BrowserHandling = BrowserHandling.blockOnConnect

  @property({ type: String })
  unsupportedBrowserHandling: BrowserHandling = BrowserHandling.blockOnConnect

  @property({
    type: Array,
  })
  requestItems: RequestItem[] = []

  render() {
    let template: TemplateResult<1> = this.renderConnectTemplate()

    if (!this.isExtensionAvailable && !this.isMobile)
      template = this.renderCeNotInstalledTemplate()
    else if (!this.isWalletLinked && !this.isMobile)
      template = this.renderCeNotLinkedTemplate()
    else if (this.isInAppBrowser) template = this.renderInAppBrowserTemplate()
    else if (this.isUnsupportedBrowser)
      template = this.renderUnsupportedBrowserTemplate()
    else if (this.status === RadixButtonStatus.pending)
      template = this.renderRequestItemsTemplate()

    return html`
      <div class="wrapper connect-your-wallet">
        <img width="44" height="44" src=${logoGradient} alt="Radix Logo" />
        <span class="text connect">Connect Your Radix Wallet</span>
      </div>
      ${template}
    `
  }

  private renderInAppBrowserTemplate() {
    return html` <div class="browser-info">
        <strong>In App Browser</strong>
        <div>Please use a supported browser to connect to Radix dApps.</div>
      </div>
      <div class="action-button">
        <radix-themed-button
          class="primary full "
          @click=${() => {
            window.open(window.location.href, '_system', 'location=yes')
          }}
        >
          Open in system browser
        </radix-themed-button>
      </div>`
  }

  private renderUnsupportedBrowserTemplate() {
    return html`
      <div class="browser-info">
        <strong>This browser is not supported</strong>
        <div>
          You can connect to this dApp with the following browsers:
          <ul class="supported-browser">
            <li>Google Chrome</li>
            <li>Safari</li>
            <li>Brave</li>
          </ul>
        </div>
      </div>
      ${this.showCloseButton
        ? html`<div class="action-button">
            <radix-themed-button
              class="primary full "
              @click=${() => {
                this.dispatchEvent(
                  new CustomEvent('onClosePopover', {
                    bubbles: true,
                    composed: true,
                  }),
                )
              }}
            >
              Close
            </radix-themed-button>
          </div>`
        : ``}
    `
  }

  private renderRequestItemsTemplate() {
    return html`<radix-request-cards
      class="request-cards"
      .requestItems=${this.requestItems}
    ></radix-request-cards>`
  }

  private connectNowButtonTemplate() {
    const disabled =
      (!this.isExtensionAvailable || !this.isWalletLinked) && !this.isMobile
    return html`<radix-themed-button
      class="${classMap({
        full: true,
        primary: true,
        disabled,
      })}"
      @click=${() => {
        if (disabled) return
        this.dispatchEvent(
          new CustomEvent('onConnect', {
            bubbles: true,
            composed: true,
          }),
        )
      }}
    >
      Connect Now
    </radix-themed-button>`
  }

  private renderCeNotInstalledTemplate() {
    return html`<div class="info">
        Before you can connect your Radix Wallet, you need the Radix Connector
        browser extension.
      </div>

      <div class="cta-link">
        <radix-link
          href="http://wallet.radixdlt.com/"
          displayText="Download and Setup Guide"
          @click=${() => {
            this.dispatchEvent(
              new CustomEvent('onLinkClick', {
                bubbles: true,
                composed: true,
                detail: { type: 'setupGuide' },
              }),
            )
          }}
        ></radix-link>
      </div>

      ${this.connectNowButtonTemplate()} `
  }

  private renderCeNotLinkedTemplate() {
    return html`<div class="info">
        To connect your Radix Wallet, you need to link it to your Radix
        Connector browser extension using a QR code.
      </div>

      <radix-themed-button
        class="primary full"
        @click=${() => {
          this.dispatchEvent(
            new CustomEvent('onLinkClick', {
              bubbles: true,
              composed: true,
              detail: { type: 'showQrCode' },
            }),
          )
        }}
      >
        Open QR Code to Link Wallet
      </radix-themed-button>

      <div class="cta-link">
        <radix-link
          href="http://wallet.radixdlt.com/"
          displayText="Download and Setup Guide"
          @click=${() => {
            this.dispatchEvent(
              new CustomEvent('onLinkClick', {
                bubbles: true,
                composed: true,
                detail: { type: 'setupGuide' },
              }),
            )
          }}
        ></radix-link>
      </div>

      ${this.connectNowButtonTemplate()} `
  }

  private renderConnectTemplate() {
    return html` ${this.connectNowButtonTemplate()} `
  }

  static styles = [
    css`
      :host {
        width: 100%;
        box-sizing: border-box;
      }

      .supported-browser li {
        text-align: left;
        padding: 0 12px;
        list-style-type: '✅';
      }

      .supported-browser li::marker {
        font-size: 13px;
      }

      .action-button {
        margin: 40px 50px 15px;
      }

      .wrapper.connect-your-wallet {
        display: flex;
        align-items: center;
        margin: 12px 0.5rem 1.5rem;
        line-height: 23px;
        justify-content: center;
        gap: 12px;
      }

      .request-cards {
        display: block;
        max-height: 410px;
        overflow-y: auto;
      }

      .card {
        margin-bottom: 10px;
      }

      .browser-info {
        margin-top: 34px;
      }

      .browser-info,
      .browser-info ul {
        padding: 0 24px;
        line-height: 24px;
      }

      .browser-info ul {
        margin-top: 10px;
        margin-left: 5px;
      }

      .info {
        margin-bottom: 20px;
        padding: 0 20px;
        font-size: 14px;
        line-height: 18px;
        text-align: center;
      }

      .cta-link {
        display: flex;
        justify-content: center;
        margin: 25px 0;
      }

      .text.connect {
        color: var(--color-text-primary);
        font-size: 18px;
        width: 7.2rem;
        font-weight: 600;
        text-align: left;
      }

      .subtitle {
        color: var(--radix-card-text-dimmed-color);
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
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-not-connected-page': RadixNotConnectedPage
  }
}
