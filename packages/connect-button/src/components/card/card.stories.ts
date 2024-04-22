import { Meta, StoryObj } from '@storybook/web-components'
import './card'
import './persona-card'
import './request-card'
import '../popover/popover'
import { html } from 'lit'
import '../account/account'

const meta: Meta = {
  title: 'Components / Cards',
}
export default meta

type Story = StoryObj

export const Onboarding: Story = {
  render: (args) => html`
    <style>
      .cards {
        margin: 10px 0px 10px;
      }
      radix-card {
        margin-bottom: 10px;
      }
      .subtitle {
        color: ${args.mode === 'light' ? '#8a8fa4' : '#CED0D6'};
        font-size: 16px;
        margin-top: 5px;
        display: block;
      }
    </style>
    <radix-popover>
      <div class="cards">
        <radix-card
          header="Radix Wallet mobile app"
          icon="checked"
        ></radix-card>
        <radix-card header="Radix Connector browser extension" icon="unchecked"
          ><span class="subtitle"
            >Get and link the Radix Connector browser extension to your Radix
            Wallet to connect securely to dApp websites.</span
          ></radix-card
        >
      </div>
    </radix-popover>
  `,
  argTypes: {},
  args: {
    icon: 'unchecked',
  },
}

const personaData = [
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
]

export const Sharing: Story = {
  render: (args) => html`
    <radix-popover connected>
      <radix-persona-card
        avatarUrl=${args.avatarUrl}
        persona=${args.persona}
        .personaData=${personaData.slice(0, args.personaDataRows)}
      ></radix-persona-card>
    </radix-popover>
  `,
  args: {
    avatarUrl: 'https://picsum.photos/200',
    personaDataRows: 2,
    persona: 'VanDammeStelea',
  },
}

export const Requests: Story = {
  render: (args) => html`
    <radix-popover connected>
      <radix-request-card
        id="${args.id}"
        status="${args.status}"
        type="${args.type}"
        timestamp=${args.timestamp}
        @onCancel=${(event: any) => {
          console.log(event)
        }}
        ?showCancel="${args.showCancel}"
        transactionIntentHash="${args.transactionIntentHash}"
      ></radix-request-card>
    </radix-popover>
  `,
  argTypes: {
    type: {
      options: ['dataRequest', 'loginRequest', 'sendTransaction'],
      control: 'select',
    },
    status: {
      options: ['pending', 'success', 'fail', 'cancelled'],
      control: 'select',
    },
    timestamp: {
      control: 'text',
    },
    transactionIntentHash: {
      control: 'text',
    },
    showCancel: {
      control: 'boolean',
    },
  },
  args: {
    id: 'abcdefg',
    type: 'loginRequest',
    status: 'pending',
    showCancel: true,
    timestamp: '123536564234',
    transactionIntentHash: '2343652434',
  },
}
