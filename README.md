[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

- [What is RDT?](#what-is-rdt)
- [Installation](#installation)
- [Usage](#usage)
  - [Getting started](#getting-started)
    - [Instantiation](#instantiation)
    - [Configuration](#configuration)
- [Data storage](#data-storage)

# What is RDT?

Radix dApp Toolkit (RDT) facilitates communication with the Radix Wallet and provides easy-to-use interface over lower level APIs.

The current version only supports desktop browser webapps with requests made via the Radix Wallet Connector browser extension. It is intended to later add support for mobile browser webapps using deep linking with the same essential interface.

**RDT is composed of:**

- **√ Connect Button** – A framework agnostic web component that keeps a minimal internal state and have properties are pushed to it.

- **Tools** – Abstractions over lower level APIs for developers to build their radix dApp at lightning speed.

- **State management** – Handles wallet responses, caching and pushes properties to the √ Connect button.

# Installation

**Using NPM**

```bash
npm install @radixdlt/radix-dapp-toolkit
```

**Using Yarn**

```bash
yarn add @radixdlt/radix-dapp-toolkit
```

# Usage

## Getting started

Add the `<radix-connect-button />` element in your HTML code and instantiate `RadixDappToolkit`.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script type="module" src="/bundle.js"></script>
  </head>
  <body>
    <radix-connect-button />
  </body>
</html>
```

### Instantiation

```typescript
import { RadixDappToolkit } from '@radixdlt/radix-dapp-toolkit'

const rdt = RadixDappToolkit(
  {
    dAppDefinitionAddress:
      'account_tdx_22_1pz7vywgwz4fq6e4v3aeeu8huamq0ctmsmzltay07vzpqm82mp5',
    dAppName: 'Name of your dApp',
  },
  (requestData) => {
    requestData({
      accounts: { quantifier: 'atLeast', quantity: 1 },
    }).map(({ data: { accounts } }) => {
      // set your application state
    })
  },
  {
    networkId: 34,
    onDisconnect: () => {
      // clear your application state
    },
    onInit: ({ accounts }) => {
      // set your initial application state
    },
  }
)
```

```typescript
type RadixDappToolkit = (
  dAppMetadata: DappMetadata,
  onConnect?: (requestData: RequestData) => void,
  configuration?: RadixDappToolkitConfiguration
) => {
  requestData: RequestData
  sendTransaction: SendTransaction
  state$: State$
  destroy: () => void
}
```

**Input**

- **requires** dAppMetadata - Specifies the dApp that is interacting with the wallet. Used in dApp verification process on the wallet side.
- **optional** onConnect - Callback function that is triggered when user clicks connect wallet in √ Connect Button.
- **optional** configuration - Additional available configuration for RDT

**Output**

- requestData - used to request data from the wallet
- sendTransaction - used for sending transactions
- state$ - a state observable. Subscribe to get a stream of the latest state.
- destroy - used in order to destroy the instance of RDT.

### Configuration

```typescript
type RadixDappToolkitConfiguration = {
  initialState?: State
  logger?: Logger<unknown>
  networkId?: number
  onInit?: OnInitCallback
  onDisconnect?: OnDisconnectCallback
  providers?: {
    storage?: StorageProvider
    connectButton?: ConnectButtonProvider
    walletClient?: WalletClient
  }
  useDoneCallback?: boolean
  explorer?: {
    baseUrl: string
    transactionPath: string
    accountsPath: string
  }
}
```

- **optional** initialState - instantiate RDT with a provided state. Useful in automated tests.
- **optional** logger - provide a logger function to debug RDT.
- **optional** networkId - specify which Radix network to use, defaults to Mainnet (0x01).
- **optional** onInit - lifecycle function that is triggered when RDT has finished bootstrapping internal state.
- **optional** onDisconnect - triggered when user clicks disconnect wallet in √ Connect Button.
- **optional** providers - allows you to provide your own modules for the internal components of RDT.
- **optional** useDoneCallback - if enabled, `done()` needs to be called to in order to complete the connect flow
- **optional** explorer - used to change the outgoing links for accounts and transactions in the √ Connect Button. Defaults to radix dashboard

# Data storage

In order to provide a consistent user experience RDT will store and read data from the browser’s local storage. This will enable state rehydration and keep state between page reloads.

To understand which wallet responses that get stored we need to understand the difference between one-time and regular data requests.

One-time data requests do not register the dApp in the wallet and the connect button does not display that data in the UI. The data is meant to be used temporarily by the dApp and discarded thereafter.

A user connecting her wallet will be the first user flow in the majority of dApps. The connect flow is a bit different from subsequent data request flows. Its purpose is to provide the dApp with a minimal amount of user data in order for the user to be able to use the dApp, e.g. the minimal amount of data for a DEX dApp is an account.

RDT handles writing and reading data to the browser’s local storage so that it will be persisted between page loads. The dApp frontend logic can at any time ask RDT to provide the stored data by subscribing to the `state$` observable or calling `requestData`. One time data requests or requests that can not be resolved by the state are sent to the wallet.
