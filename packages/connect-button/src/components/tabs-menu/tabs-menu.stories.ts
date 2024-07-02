import { Meta, StoryObj } from '@storybook/web-components'
import './tabs-menu'
import { html } from 'lit'

const meta: Meta = {
  title: 'Components / Tabs menu',
}
export default meta

type Story = StoryObj

export const Primary: Story = {
  render: (args) => html`
    <radix-tabs-menu
      active=${args.activeTab}
      @onClick=${(ev: CustomEvent) => {
        console.log(`clicked: ${ev.detail.value}`)
      }}
    ></radix-tabs-menu>
  `,
  argTypes: {
    activeTab: {
      options: ['sharing', 'requests'],
      control: 'select',
    },
  },
  args: {
    activeTab: 'sharing',
  },
}
