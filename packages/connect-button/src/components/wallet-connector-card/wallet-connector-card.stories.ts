import { Meta, StoryObj } from '@storybook/web-components'
import { html } from 'lit'
import '../loading-spinner/loading-spinner'
import './wallet-connector-card'
import './wallet-connector-info'
import '../mask/mask'

const meta: Meta = {
  title: 'Components / Wallet Connector Card',
}
export default meta

type Story = StoryObj

export const Simple: Story = {
  render: (args) =>
    html` <radix-wallet-connector-card header=${args.header}>
      <h1>Hi</h1>
    </radix-wallet-connector-card>`,
  args: {
    header: 'Radix Wallet Connector',
  },
}

export const Loading: Story = {
  render: (args) =>
    html` <radix-mask isBranded
      ><radix-wallet-connector-card header=${args.header}>
        <div style="padding: 32px 0;display: flex; justify-content: center;">
          <radix-loading-spinner></radix-loading-spinner>
        </div> </radix-wallet-connector-card
    ></radix-mask>`,
  args: {
    header: 'Radix Wallet Connector',
  },
}

export const ErrorState: Story = {
  render: (args) =>
    html` <radix-wallet-connector-card header=${args.header}>
      <div style="padding: 18px 0;display: flex; justify-content: center;">
        <radix-wallet-connector-info
          header="Connection failed"
          subheader="Go back and try again, you can close this tab"
          isError
        ></radix-wallet-connector-info>
      </div>
    </radix-wallet-connector-card>`,
  args: {
    header: 'Radix Wallet Connector',
  },
}

export const ConnectionSuccessfulStory: Story = {
  render: (args) =>
    html` <radix-wallet-connector-card header=${args.header}>
      <div style="padding: 18px 0;display: flex; justify-content: center;">
        <radix-wallet-connector-info
          header="This page is no longer active "
          subheader="You can now close this tab"
        ></radix-wallet-connector-info>
      </div>
    </radix-wallet-connector-card>`,
  args: {
    header: 'Radix Wallet Connector',
  },
}

export const PageNoLongerActive: Story = {
  render: (args) =>
    html` <radix-wallet-connector-card header=${args.header}>
      <div style="padding: 18px 0;display: flex; justify-content: center;">
        <radix-wallet-connector-info
          header="Connection successful"
          subheader="You can now close this tab"
        ></radix-wallet-connector-info>
      </div>
    </radix-wallet-connector-card>`,
  args: {
    header: 'Radix Wallet Connector',
  },
}

export const WithMask: Story = {
  render: (args) => html`
    <radix-mask isBranded>
      <radix-wallet-connector-card header=${args.header}>
        <div style="padding: 18px 0;display: flex; justify-content: center;">
          <radix-wallet-connector-info
            header="Connection successful"
            subheader="You can now close this tab"
          ></radix-wallet-connector-info>
        </div> </radix-wallet-connector-card
    ></radix-mask>
  `,
  args: {
    header: 'Radix Wallet Connector',
  },
}
