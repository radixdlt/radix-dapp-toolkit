import { Story, Meta } from '@storybook/web-components'
import { html } from 'lit-html'
import {
  Account,
  PersonaData,
  RadixButtonStatus,
  RequestItem,
} from 'radix-connect-common'
import './connect-button'
import { ConnectButton } from './connect-button'
import './connect-button.stories.css'
import { BUTTON_MIN_WIDTH } from '../constants'

export default {
  title: 'Radix/Connect button states',
} as Meta

const getConnectButton: () => ConnectButton = () =>
  document.querySelector('radix-connect-button')!

const argTypes = {
  status: {
    options: [
      RadixButtonStatus.default,
      RadixButtonStatus.error,
      RadixButtonStatus.pending,
      RadixButtonStatus.success,
    ],
    control: 'select',
  },
  activeTab: {
    options: ['sharing', 'requests'],
    control: 'select',
  },
  isMobile: {
    control: 'boolean',
  },
  enableMobile: {
    control: 'boolean',
  },
}

const defaultArgs = {
  render: true,
  borderRadius: 10,
  showPopoverMenu: true,
  width: BUTTON_MIN_WIDTH,
  height: 40,
}

const Button = (args: any, { globals }: any) => {
  if (args.render)
    return html`
      <script>
        document
          .querySelector('radix-connect-button')
          .addEventListener('onLinkClick', (ev) => {
            console.log('onLinkClick', ev.detail)
          })
      </script>
      <style>
        body {
          --radix-connect-button-width: ${args.width
            ? `${args.width}px`
            : undefined};

          --radix-connect-button-height: ${args.height
            ? `${args.height}px`
            : undefined};

          --radix-connect-button-border-radius: ${args.borderRadius
            ? `${args.borderRadius}px`
            : undefined};
        }
      </style>

      <div class="connect-button-wrapper">
        <radix-connect-button
          personaLabel=${args.personaLabel}
          dAppName="${args.dAppName}"
          status=${args.status}
          mode=${globals.theme}
          avatarUrl=${args.avatarUrl}
          activeTab=${args.activeTab}
          loggedInTimestamp=${args.loggedInTimestamp}
          ?connected=${args.connected}
          ?isMobile=${args.isMobile}
          ?enableMobile=${args.enableMobile}
          ?isWalletLinked=${args.isWalletLinked}
          ?isExtensionAvailable=${args.isExtensionAvailable}
          ?showPopoverMenu=${args.showPopoverMenu}
          .requestItems=${args.requestItems}
          .accounts=${args.accounts}
          .personaData=${args.personaData}
          @onCancelRequestItem=${(event: CustomEvent<{ id: string }>) => {
            const connectButton = getConnectButton()
            console.log('cancelled', event.detail.id)
            connectButton.requestItems = connectButton.requestItems.map(
              (item: RequestItem) =>
                item.interactionId === event.detail.id
                  ? { ...item, status: 'fail', error: 'canceledByUser' }
                  : item,
            )
          }}
          @onDisconnect=${() => {
            getConnectButton().connected = false
            getConnectButton().requestItems = []
          }}
          @onDestroy=${() => {}}
          @onConnect=${() => {
            getConnectButton().status = RadixButtonStatus.pending
            getConnectButton().requestItems = [
              {
                interactionId: crypto.randomUUID(),
                type: 'loginRequest',
                status: 'pending',
                createdAt: 326575486756987,
                showCancel: true,
                walletInteraction: {},
              },
            ]
          }}
          @onShowPopover=${() => {
            console.log('onShowPopover')
          }}
        >
        </radix-connect-button>
      </div>
    `
  return ''
}

const Template: Story<Partial<any>> = (args, context) => Button(args, context)

const accounts: Account[] = [
  {
    label: 'My Main Account',
    address:
      'account_tdx_b_1qlxj68pketfcx8a6wrrqyvjfzdr7caw08j22gm6d26hq3g6x5m',
    appearanceId: 1,
  },
  {
    label: 'Second Account',
    address:
      'account_tdx_b_1queslxclg3ya6tyqqgs2ase7wgst2cvpwqq96ptkqj6qaefsgy',
    appearanceId: 2,
  },
  {
    label: 'Holiday Funds',
    address:
      'account_tdx_b_1queslxclg3ya6tyqqgs2ase7wgst2cvpwqq96ptkqj6qaefsgy',
    appearanceId: 3,
  },
  {
    label: 'Private Savings',
    address:
      'account_tdx_b_1queslxclg3ya6tyqqgs2ase7wgst2cvpwqq96ptkqj6qaefsgy',
    appearanceId: 4,
  },
]

const personaData: PersonaData[] = [
  {
    field: 'givenName',
    value: 'Matthew',
  },
  {
    field: 'familyName',
    value: 'Hines',
  },
  {
    field: 'emailAddress',
    value: 'matt@radmatt.io',
  },
  {
    field: 'phoneNumber',
    value: '123 123 1234',
  },
]

export const connectorExtensionNotInstalled = Template.bind({})
connectorExtensionNotInstalled.args = {
  ...defaultArgs,
  isExtensionAvailable: false,
}

export const connectorExtensionNotLinked = Template.bind({})
connectorExtensionNotLinked.args = {
  ...defaultArgs,
  isExtensionAvailable: true,
  isWalletLinked: false,
}

export const readyToConnect = Template.bind({})
readyToConnect.args = {
  ...defaultArgs,
  isWalletLinked: true,
  isExtensionAvailable: true,
}

export const connectingInProgress = Template.bind({})
// More on args: https://storybook.js.org/docs/web-components/writing-stories/args
connectingInProgress.args = {
  ...defaultArgs,
  status: RadixButtonStatus.pending,
  isMobile: false,
  isWalletLinked: false,
  isExtensionAvailable: false,
  connected: false,
  requestItems: [
    {
      id: crypto.randomUUID(),
      type: 'loginRequest',
      status: 'pending',
      showCancel: true,
      timestamp: 1690554318703,
    },
  ],
  accounts,
  personaLabel: 'RadMatt',
  render: true,
}
connectingInProgress.argTypes = argTypes

export const mobileView = Template.bind({})
mobileView.args = {
  ...defaultArgs,
  width: 120,
  modal: true,
  isMobile: true,
}
mobileView.argTypes = argTypes

export const linking = Template.bind({})
linking.args = {
  ...defaultArgs,
  width: 120,
  isMobile: true,
  enableMobile: true,
}
linking.argTypes = argTypes

export const sharing = Template.bind({})
sharing.args = {
  ...defaultArgs,
  connected: true,
  dAppName: 'Radix Dashboard',
  status: RadixButtonStatus.default,
  activeTab: 'sharing',
  personaLabel: 'VanDammeStelea',
  avatarUrl:
    'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png',
}
sharing.argTypes = argTypes

export const sharing2 = Template.bind({})
sharing2.args = {
  ...sharing.args,
  personaData: [
    {
      field: '',
      value: 'Alex Stelea',
    },
  ],
  accounts: [
    {
      label: 'My Main Account',
      address:
        'account_tdx_b_1qlxj68pketfcx8a6wrrqyvjfzdr7caw08j22gm6d26hq3g6x5m',
      appearanceId: 1,
    },
  ],
}
sharing2.argTypes = argTypes

export const sharing3 = Template.bind({})
sharing3.args = {
  ...sharing2.args,
  personaData: [
    {
      field: '',
      value: 'Alex Stelea',
    },
    {
      field: 'mail',
      value: 'alex.stelea@van.damme',
    },
    {
      field: 'phone',
      value: '+42084652103',
    },
  ],
}
sharing3.argTypes = argTypes

export const sharing4 = Template.bind({})
sharing4.args = {
  ...sharing3.args,
  accounts: [
    ...sharing3.args.accounts,
    {
      label: 'Second Account',
      address: 'account_tdx_b_1qlxj68pketfcx8a6wrrqyvjfzdr7caw08j22gm6d26hq',
      appearanceId: 2,
    },
    {
      label: 'Holiday Funds',
      address: 'account_tdx_b_1qlxj68pketfcx8a6wrrqyvjfzdr7ca',
      appearanceId: 3,
    },
  ],
}
sharing4.argTypes = argTypes

export const sharing5 = Template.bind({})
sharing5.args = {
  ...sharing4.args,
  personaData: [
    ...sharing4.args.personaData,
    {
      field: 'address',
      value: `
45 Avebury Drive, Duncan, Elshewhere, NY 98827
`,
    },
    { field: 'passport', value: 'Passport: 78668279872HS' },
  ],
}
sharing5.argTypes = argTypes

export const requests = Template.bind({})
requests.args = {
  ...defaultArgs,
  connected: true,
  personaLabel: 'RadMatt',
  dAppName: 'Radix Dashboard',
  loggedInTimestamp: '3256345786456',
  status: RadixButtonStatus.default,
  activeTab: 'requests',
  requestItems: [
    {
      id: crypto.randomUUID(),
      type: 'dataRequest',
      status: 'pending',
      timestamp: 1690154318703,
      showCancel: true,
    },
    {
      id: crypto.randomUUID(),
      type: 'sendTransaction',
      status: 'success',
      transactionIntentHash: 'transaction_1342a4b43e8f9fde27ef9284',
      timestamp: 169032318703,
    },
    {
      id: crypto.randomUUID(),
      type: 'dataRequest',
      status: 'fail',
      timestamp: 1690254318703,
    },
    {
      id: crypto.randomUUID(),
      type: 'loginRequest',
      status: 'cancelled',
      timestamp: 1690454318703,
    },
    {
      id: crypto.randomUUID(),
      type: 'dataRequest',
      status: 'success',
      timestamp: 1690454318703,
    },
    {
      id: crypto.randomUUID(),
      type: 'sendTransaction',
      status: 'success',
      transactionIntentHash: 'transaction_1342a4b43e8f9fde27ef9284',
      timestamp: 169032318703,
    },
  ],
}
requests.argTypes = argTypes

export const connected = Template.bind({})
// More on args: https://storybook.js.org/docs/web-components/writing-stories/args
connected.args = {
  width: BUTTON_MIN_WIDTH,
  height: 40,
  borderRadius: 20,
  dAppName: 'Radix Dashboard',
  activeTab: 'sharing',
  showPopoverMenu: true,
  loggedInTimestamp: Date.now(),
  status: RadixButtonStatus.success,
  connected: true,
  avatarUrl:
    'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png',
  requestItems: [
    {
      id: crypto.randomUUID(),
      type: 'sendTransaction',
      status: 'pending',
      timestamp: Date.now(),
      showCancel: true,
    },
    {
      id: crypto.randomUUID(),
      type: 'loginRequest',
      status: 'success',
      timestamp: 169032318703,
    },
    {
      id: crypto.randomUUID(),
      type: 'sendTransaction',
      status: 'fail',
      timestamp: 1690254318703,
    },
    {
      id: crypto.randomUUID(),
      type: 'loginRequest',
      status: 'cancelled',
      timestamp: 1690454318703,
    },
  ],
  accounts,
  personaData,
  personaLabel: 'RadMatt',
  render: true,
}
connected.argTypes = argTypes
