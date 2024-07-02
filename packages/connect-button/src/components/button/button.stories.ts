import { Meta, StoryObj } from '@storybook/web-components'
import { html } from 'lit-html'
import './button.stories.css'
import './button'
import { BUTTON_MIN_HEIGHT, BUTTON_MIN_WIDTH } from '../../constants'
import { RadixButtonStatus } from 'radix-connect-common'

type Story = StoryObj

const meta: Meta = {
  title: 'Components / Button',
  component: 'radix-button',
}
export default meta

type Args = (typeof Themes)['args']

const createButton = (args: any) => html`
  <radix-button
    theme=${args.theme}
    ?connected=${args.connected}
    ?fullWidth=${args.fullWidth}
    status=${args.status}
    ><div>${args.text}</div></radix-button
  >
`

const createRow = (args: Args) => {
  const borderRadius = [0, 4, 12, 50]
  return new Array(4).fill(null).map(
    (_, index) =>
      html` <style>
          .button-${index}-${args!.theme} > radix-button {
            --radix-connect-button-border-radius: ${borderRadius[index]
              ? `${borderRadius[index]}px`
              : undefined};
          }
          .button-${index}-${args!.theme} radix-button:first-child {
            --radix-connect-button-width: 40px;
          }
          .button-${index}-${args!.theme} radix-button:last-child {
            --radix-connect-button-width: 139px;
          }
        </style>

        <div class="row button-${index}-${args!.theme}">
          ${createButton({
            ...args,
            borderRadius: borderRadius[index],
          })}
          ${createButton({
            ...args,
            borderRadius: borderRadius[index],
          })}
        </div>`,
  )
}

export const Primary: Story = {
  render: (args) =>
    html`<style>
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
      <radix-button
        theme=${args.theme}
        status=${args.status}
        ?connected=${args.connected}
        ?full-width=${args.fullWidth}
        ><div>${args.connected ? args.text : 'Connect'}</div></radix-button
      >`,
  argTypes: {
    theme: {
      options: ['radix-blue', 'black', 'white-with-outline', 'white'],
      control: 'select',
    },
    text: {
      control: 'text',
    },
    status: {
      options: [
        RadixButtonStatus.default,
        RadixButtonStatus.pending,
        RadixButtonStatus.success,
        RadixButtonStatus.error,
      ],
      control: 'select',
    },
  },
  args: {
    width: BUTTON_MIN_WIDTH,
    height: BUTTON_MIN_HEIGHT,
    borderRadius: 0,
    theme: 'radix-blue',
    connected: true,
    text: 'Matthew Hine',
    fullWidth: false,
    status: RadixButtonStatus.default,
  },
}

export const Themes: Story = {
  render: (args) =>
    html` <style>
        body {
          --radix-connect-button-border-radius: ${args.borderRadius
            ? `${args.borderRadius}px`
            : undefined};
        }
      </style>
      <div class="wrapper">
        <div class="column">
          ${createRow({ ...args, theme: 'radix-blue', connected: false })}
        </div>
        <div class="column">
          ${createRow({ ...args, theme: 'black', connected: false })}
        </div>
        <div class="column">
          ${createRow({
            ...args,
            theme: 'white-with-outline',
            connected: false,
          })}
        </div>
        <div class="column dark">
          ${createRow({ ...args, theme: 'white', connected: false })}
        </div>
        <div class="column">
          ${createRow({
            ...args,
            connected: true,
            text: 'Matthew Hine',
          })}
        </div>
      </div>`,
  argTypes: {
    theme: {
      options: ['radix-blue', 'black', 'white-with-outline', 'white'],
      control: 'select',
    },
    status: {
      options: [
        RadixButtonStatus.default,
        RadixButtonStatus.pending,
        RadixButtonStatus.success,
        RadixButtonStatus.error,
      ],
      control: 'select',
    },
    text: {
      control: 'text',
    },
  },
  args: {
    text: 'Connect',
    status: RadixButtonStatus.default,
  },
}
