import { Meta, StoryObj } from '@storybook/web-components'
import './account'
import { html } from 'lit'

const meta: Meta = {
  title: 'Components / Account',
  component: 'radix-account',
}
export default meta

type Story = StoryObj

const accounts = [
  [
    'Main',
    'account_tdx_21_12x4zx09f8962a9wesfqvxaue0qn6m39r3cpysrjd6dtqppzhrkjrsr',
  ],
  [
    'Staking',
    'account_tdx_21_12yccemy8vx37qkctmpkgdtatxe8mdmwl9mndv5dx69mj7tg45d4q88',
  ],
  [
    'Professional',
    'account_tdx_21_129tr5q2g6eh7zxwzl6tj0ndq87zzuqynqt56xpe3v2pf5k9wp67ju6',
  ],
  [
    'Travel',
    'account_tdx_21_129q44nllnywkm8pscgqfq5wkpcfxtq2xffyca745c3fau3swhkhrjw',
  ],
  [
    'VeryLongAccountNameVeryLongAccountNameVeryLongAccountName',
    'account_tdx_21_129vzduy6q5ufxxekf66eqdjy2vrm6ezdl0sh5kjhgrped9p5k6t9nf',
  ],
]

export const Single: Story = {
  render: (args) => html`
    <radix-account
      address=${args.address}
      appearanceId=${args.appearanceId}
      label=${args.label}
    ></radix-account>
  `,
  args: {
    address:
      'account_tdx_21_129tr5q2g6eh7zxwzl6tj0ndq87zzuqynqt56xpe3v2pf5k9wp67ju6',
    label: 'Radix Account',
    appearanceId: 0,
  },
}

export const Multiple: Story = {
  render: () => html`
    <style>
      div {
        max-width: 500px;
      }
    </style>
    <div>
      ${accounts.map(
        ([label, address], index) =>
          html` <radix-account
            address=${address}
            appearanceId=${index}
            label=${label}
          ></radix-account>`,
      )}
    </div>
  `,
}
