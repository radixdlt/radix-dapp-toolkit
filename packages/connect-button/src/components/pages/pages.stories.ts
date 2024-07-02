import { Meta, StoryObj } from '@storybook/web-components'
import { html } from 'lit'
import '../account/account'
import './sharing'
import './not-connected'
import '../popover/popover'
import { RadixButtonStatus } from 'radix-connect-common'

const meta: Meta = {
  title: 'Components / Pages',
}
export default meta

type Story = StoryObj

export const Sharing: Story = {
  render: (args) =>
    html` <radix-popover>
      <radix-sharing-page
        dAppName=${args.dAppName}
        avatarUrl=${args.avatarUrl}
        persona=${args.persona}
        .personaData=${args.personaData}
        .accounts=${args.accounts}
      ></radix-sharing-page>
    </radix-popover>`,
  args: {
    avatarUrl: 'https://picsum.photos/200',
    persona: 'VanDammeStelea',
    dAppName: 'Dashboard',
    personaData: [
      'Alex Stelea',
      'alex.stelea@van.damme',
      '+42084652103',
      '45 Avebury Drive, Duncan Road, Elshewhere, NY 98827',
      'Passport: 78668279872HS',
      'Lorem ipsum',
      'dolor sit amet',
      'consectetur adipiscing elit',
      'Aenean',
      'ultrices sodales',
      'ex, vitae fringilla',
    ],
    accounts: [
      [
        'Main',
        'account_tdx_21_12x4zx09f8962a9wesfqvxaue0qn6m39r3cpysrjd6dtqppzhrkjrsr',
      ],
      [
        'Saving',
        'account_tdx_21_12xdjp5dq7haph4c75mst99mc26gkm8mys70v6qlyz0fz86f9ucy0ru',
      ],
      [
        'Degen',
        'account_tdx_21_1298kg54s9r9evc5tgglj2wrqsatuflwxg5s3m845uut6t3jtyh6cyy',
      ],
      [
        'Gaming',
        'account_tdx_21_12y78nedvqg9svp49fjs4f9y5kreweqxt6vszaprnfq8kjhralku6fz',
      ],
      [
        'Trading',
        'account_tdx_21_128pncqprt3gfew04aefqy549ecvfp0a99mxjpa6wcpl2n2ymqr8gj3',
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
        'Fun',
        'account_tdx_21_12xgzze2krhmw95r07y4pccssgyjxzwgem86hndy8cujfzhkggdpt7s',
      ],
      [
        'Travel',
        'account_tdx_21_129q44nllnywkm8pscgqfq5wkpcfxtq2xffyca745c3fau3swhkhrjw',
      ],
      [
        'Alpha',
        'account_tdx_21_12yc8neefcqfum2u4r5xtgder57va8ahdjm3qr9eatyhmdec62ya6m4',
      ],
      [
        'Beta',
        'account_tdx_21_12yg7c2752f4uwy6ayljg3g5pvj36xxdy690hj7fpllsed53jsgczz4',
      ],
      [
        'VeryLongAccountName',
        'account_tdx_21_129vzduy6q5ufxxekf66eqdjy2vrm6ezdl0sh5kjhgrped9p5k6t9nf',
      ],
    ].map(([label, address], appearanceId) => ({
      label,
      address,
      appearanceId,
    })),
  },
}

export const NotConnected: Story = {
  render: (args) =>
    html`<radix-popover>
      <radix-not-connected-page
        .requestItems=${args.requestItems}
        status=${args.status}
        ?isWalletLinked=${args.isWalletLinked}
        ?isExtensionAvailable=${args.isExtensionAvailable}
        ?isMobile=${args.isMobile}
      >
      </radix-not-connected-page>
    </radix-popover>`,
  argTypes: {
    status: {
      options: [RadixButtonStatus.default, RadixButtonStatus.pending],
      control: 'select',
    },
    requestItems: {
      mapping: {
        loginRequestWithCancel: [
          {
            type: 'loginRequest',
            status: 'pending',
            timestamp: 1690554318703,
            showCancel: true,
          },
        ],
        loginRequestWithoutCancel: [
          {
            type: 'loginRequest',
            status: 'pending',
            timestamp: 1690554318703,
            showCancel: false,
          },
        ],
        empty: undefined,
      },
      control: 'select',
      options: ['loginRequestWithCancel', 'loginRequestWithoutCancel', 'empty'],
    },
  },
  args: {
    isMobile: false,
    status: 'default',
    isExtensionAvailable: false,
    isWalletLinked: false,
    requestItems: undefined,
  },
}
