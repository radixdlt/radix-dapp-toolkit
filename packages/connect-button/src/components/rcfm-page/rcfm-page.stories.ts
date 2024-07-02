import { Meta, StoryObj } from '@storybook/web-components'
import { html } from 'lit'
import './rcfm-page'

const meta: Meta = {
  title: 'Components / RCfM Page',
}
export default meta

type Story = StoryObj

export const Simple: Story = {
  render: (args) =>
    html` <radix-rcfm-page
      header=${args.header}
      subheader=${args.subheader}
      ?isError=${args.isError}
      ?isLoading=${args.isLoading}
    >
    </radix-rcfm-page>`,
  args: {
    header: 'This page is no longer active ',
    subheader: 'Go back and try again, you can close this tab ',
    isError: false,
    isLoading: true,
  },
}
