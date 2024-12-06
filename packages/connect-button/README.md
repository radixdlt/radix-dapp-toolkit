# What is √ Connect Button?

The **√ Connect Button** is a framework agnostic [custom element](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements) which appears as a consistent, Radix-branded UI that helps users identify your dApp website as a Radix dApp. It communicates with outer world through attributes and DOM events.

# Usage

## Getting started

Add the `<radix-connect-button />` element in your HTML code and instantiate [Radix Dapp Toolkit](../dapp-toolkit/README.md).

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <radix-connect-button />
  </body>
</html>
```

## Setting properties programmatically

To manually set properties on the √ Connect Button.

```typescript
const radixConnectButton = document.querySelector('radix-connect-button')!

const handleConnect = () => {
  radixConnectButton.status = 'pending'
}

radixConnectButton.addEventListener('onConnect', handleConnect)
```

```typescript
type ConnectButtonProperties = {
  theme: RadixButtonTheme
  dAppName: string
  personaLabel: string
  connected: boolean
  status: RadixButtonStatus
  loggedInTimestamp: string
  showPopover: boolean
  requestItems: RequestItem[]
  accounts: Account[]
  personaData: PersonaData[]
  isMobile: boolean
  isWalletLinked: boolean
  isExtensionAvailable: boolean
  fullWidth: boolean
  activeTab: 'sharing' | 'requests'
  mode: RadixButtonMode
  avatarUrl: string
}
```

- theme - defaults to `radix-blue`, other values are `black`, `white` and `white-with-outline`
- dAppName - name of the dApp
- personaLabel - label of the connected persona
- connected - set connected state
- status - set current button status, can be one of `default`, `error`, `pending`, `success`
- loggedInTimestamp - timestamp of login
- showPopover - display connect button popover
- requestItems - displays a list of maximum 3 request items in the popover
- accounts - displays a list of connected accounts
- personaData - list of persona fields together with values
- isMobile - display popover centered inside a blurred mask
- isWalletLinked - if set to false, display information about how to link wallet (only applicable if `isMobile: false`)
- isExtensionAvailable - if set to false, display information about how to download Connector Extension (only applicable for `isMobile: false`)
- fullWidth - makes the button full width in its container
- activeTab - changes active tab inside popover
- mode - set styling of a popover

## Events

```typescript
type ConnectButtonEvents = {
  onConnect: () => void
  onDisconnect: () => void
  onCancelRequestItem: (event: CustomEvent<{ id: string }>) => void
  onIgnoreTransactionItem: (event: CustomEvent<{ id: string }>) => void
  onDestroy: () => void
  onShowPopover: () => void
  onUpdateSharedAccounts: () => void
}
```

- onConnect - triggers when user clicks connect now button
- onDisconnect - triggers when user clicks disconnect wallet button
- onCancelRequestItem - triggers when user cancels data or login request
- onIgnoreTransactionItem - triggers when user ignores transaction output
- onDestroy - triggers when button is removed from the DOM. Useful for cleaning up registered event listeners and subscriptions.
- onShowPopover - triggers when users clicks on radix button and popover is being shown
- onUpdateSharedAccounts - triggers when users clicks on "Update Account Sharing" button

# Playground

You can play around with different settings using our storybook instance. Visit [connect-button-storybook.radixdlt.com](https://connect-button-storybook.radixdlt.com/) to easily experiment with Connect Button.

> [!IMPORTANT]
> Placing Connect Button inside container which uses `backdrop-filter` can cause troubles. Please check ["header with blur"](https://connect-button-storybook.radixdlt.com/?path=/docs/radix-header-with-blur--docs) section inside storybook to check for workaround solution

# License

The √ Connect Button binaries are licensed under the [Radix Software EULA](http://www.radixdlt.com/terms/genericEULA)

The √ Connect Button code is released under [Apache 2.0 license](LICENSE).

      Copyright 2023 Radix Publishing Ltd

      Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.

      You may obtain a copy of the License at: http://www.apache.org/licenses/LICENSE-2.0

      Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

      See the License for the specific language governing permissions and limitations under the License.
