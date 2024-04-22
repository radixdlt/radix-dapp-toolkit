import { Meta, StoryObj } from '@storybook/web-components'
import './popover'
import '../tabs-menu/tabs-menu'
import { html } from 'lit'

const meta: Meta = {
  title: 'Components / Popover',
  component: 'radix-popover',
}
export default meta

type Story = StoryObj

export const Primary: Story = {
  render: (args) => html`
    <radix-popover ?connected=${args.connected}></radix-popover>
  `,
  args: {
    connected: true,
  },
}
