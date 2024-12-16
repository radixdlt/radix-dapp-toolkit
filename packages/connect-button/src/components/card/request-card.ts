import { html, css, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import './card'
import '../account/account'
import '../link/link'
import { shortenAddress } from '../../helpers/shorten-address'
import { classMap } from 'lit/directives/class-map.js'
import {
  RequestItemTypes,
  RequestStatusTypes,
  RequestStatus,
} from 'radix-connect-common'
@customElement('radix-request-card')
export class RadixRequestCard extends LitElement {
  @property({
    type: String,
  })
  type: RequestItemTypes = 'dataRequest'

  @property({
    type: String,
  })
  status: RequestStatusTypes = 'pending'

  @property({
    type: Boolean,
  })
  showCancel: boolean = false

  @property({
    type: Boolean,
  })
  showIgnore: boolean = false

  @property({
    type: String,
  })
  timestamp: string = ''

  @property({
    type: String,
  })
  id: string = ''

  @property({
    type: String,
  })
  hash: string = ''

  render() {
    const icon = this.getIconFromStatus()
    const styling = this.getStylingFromStatus()
    const texts = {
      sendTransaction: {
        pending: 'Pending Transaction',
        fail: 'Transaction Failed',
        cancelled: 'Transaction Cancelled',
        ignored: 'Transaction Ignored',
        success: 'Send transaction',
        pendingCommit: '',
        timedOut: '',
        content: html`
          ${this.renderHash()}
          ${this.status === 'pending'
            ? html`<div class="request-content">
                Open your Radix Wallet app to review the transaction
                ${this.showCancel
                  ? html`<div class="cancel" @click=${this.onCancel}>
                      Cancel
                    </div>`
                  : html`<div class="cancel" @click=${this.onIgnore}>
                      Ignore
                    </div>`}
              </div>`
            : ''}
        `,
      },
      preAuthorizationRequest: {
        pending: 'Preauthorization Pending',
        fail: 'Preauthorization Failed',
        cancelled: 'Preauthorization Cancelled',
        success: 'Preauthorization Request',
        ignored: 'Preauthorization Ignored',
        pendingCommit: 'Preauthorization Lookup',
        timedOut: 'Preauthorization Timed Out',
        content: html`
          ${this.renderHash()}
          ${this.status === 'pending'
            ? html`<div class="request-content">
                Open your Radix Wallet app to review the preauthorization
                ${this.showCancel
                  ? html`<div class="cancel" @click=${this.onCancel}>
                      Cancel
                    </div>`
                  : html`<div class="cancel" @click=${this.onIgnore}>
                      Ignore
                    </div>`}
              </div>`
            : this.status === RequestStatus.pendingCommit
              ? html`<div class="request-content">
                  <div class="cancel" @click=${this.onIgnore}>Ignore</div>
                </div>`
              : ''}
        `,
      },
      dataRequest: {
        pending: 'Data Request Pending',
        fail: 'Data Request Rejected',
        cancelled: 'Data Request Rejected',
        ignored: '',
        pendingCommit: '',
        timedOut: '',
        success: 'Data Request',
        content: this.getRequestContentTemplate(
          'Open Your Radix Wallet App to complete the request',
        ),
      },
      loginRequest: {
        pending: 'Login Request Pending',
        fail: 'Login Request Rejected',
        cancelled: 'Login Request Rejected',
        success: 'Login Request',
        ignored: '',
        pendingCommit: '',
        timedOut: '',
        content: this.getRequestContentTemplate(
          'Open Your Radix Wallet App to complete the request',
        ),
      },
      proofRequest: {
        pending: 'Proof Request Pending',
        fail: 'Proof Request Rejected',
        cancelled: 'Proof Request Rejected',
        success: 'Proof Request',
        ignored: '',
        pendingCommit: '',
        timedOut: '',
        content: this.getRequestContentTemplate(
          'Open Your Radix Wallet App to complete the request',
        ),
      },
    }

    return html`<radix-card
      icon="${icon}"
      class=${styling}
      timestamp="${this.timestamp}"
      header="${texts[this.type][this.status]}"
    >
      ${texts[this.type].content}
    </radix-card>`
  }

  private getRequestContentTemplate(text: string) {
    return this.status === RequestStatus.pending
      ? html`<div class="request-content">
          ${text}
          ${this.showCancel
            ? html`<div class="cancel" @click=${this.onCancel}>Cancel</div>`
            : ``}
        </div>`
      : ''
  }

  private hasErrorIcon(status: RequestStatusTypes) {
    return (
      [
        RequestStatus.cancelled,
        RequestStatus.fail,
        RequestStatus.ignored,
      ] as string[]
    ).includes(status)
  }

  private hasPendingIcon(status: RequestStatusTypes) {
    return ([RequestStatus.pending, RequestStatus.pendingCommit] as string[]).includes(
      status,
    )
  }

  private hasIgnoredIcon(status: RequestStatusTypes) {
    return (
      [RequestStatus.ignored, RequestStatus.timedOut] as string[]
    ).includes(status)
  }

  private getIconFromStatus() {
    return this.hasPendingIcon(this.status)
      ? 'pending'
      : this.hasIgnoredIcon(this.status)
        ? 'ignored'
        : this.hasErrorIcon(this.status)
          ? 'error'
          : 'checked'
  }

  private getStylingFromStatus() {
    return classMap({
      dimmed: this.hasErrorIcon(this.status),
      inverted: this.status === 'pending',
    })
  }

  private onCancel(event: MouseEvent) {
    this.dispatchEvent(
      new CustomEvent('onCancelRequestItem', {
        detail: {
          ...event,
          id: this.id,
        },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private onIgnore(event: MouseEvent) {
    this.dispatchEvent(
      new CustomEvent('onIgnoreTransactionItem', {
        detail: {
          ...event,
          id: this.id,
        },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private renderHash() {
    return this.hash
      ? html`<div class="transaction">
          <span class="text-dimmed">ID:</span>
          <radix-link
            displayText="${shortenAddress(this.hash)}"
            @click=${(event: MouseEvent) => {
              event.preventDefault()
              this.dispatchEvent(
                new CustomEvent('onLinkClick', {
                  bubbles: true,
                  composed: true,
                  detail: {
                    type:
                      this.type === 'sendTransaction'
                        ? 'transaction'
                        : 'subintent',
                    data: this.hash,
                  },
                }),
              )
            }}
          ></radix-link>
        </div>`
      : ''
  }

  static styles = [
    css`
      :host {
        display: flex;
        width: 100%;
        margin-bottom: 10px;
      }

      .text-dimmed {
        color: var(--radix-card-text-dimmed-color);
        margin-right: 5px;
      }

      .transaction {
        font-weight: 600;
        text-decoration: none;
        display: flex;
        align-items: center;
        font-size: 14px;
      }

      .cancel {
        cursor: pointer;
        text-decoration: underline;
      }

      .request-content {
        margin-top: 5px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        font-size: 14px;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'radix-request-card': RadixRequestCard
  }
}
