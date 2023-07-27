[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

- [What is Radix dApp Toolkit?](#what-is-radix-dapp-toolkit)
  - [Resources](#resources)
    - [Building a dApp frontend](#building-a-dapp-frontend)
- [Installation](#installation)
- [Usage](#usage)
  - [Getting started](#getting-started)
  - [Wallet data](#wallet-data)
      - [Trigger wallet data request programmatically](#trigger-wallet-data-request-programmatically)
    - [Change requested data](#change-requested-data)
    - [One Time Data Request](#one-time-data-request)
  - [State changes](#state-changes)
  - [Send transaction](#send-transaction)
    - [Build transaction manifest](#build-transaction-manifest)
    - [sendTransaction](#sendtransaction)
  - [Login](#login)
    - [User authentication](#user-authentication)
    - [User authentication management](#user-authentication-management)
- [ROLA (Radix Off-Ledger Authentication)](#rola-radix-off-ledger-authentication)
- [√ Connect Button](#-connect-button)
- [Setting up your dApp Definition](#setting-up-your-dapp-definition)
  - [Setting up a dApp Definition on the Radix Dashboard](#setting-up-a-dapp-definition-on-the-radix-dashboard)
- [Data storage](#data-storage)
- [Examples](#examples)

# What is Radix dApp Toolkit?

Radix dApp Toolkit (RDT) is a TypeScript library that helps facilitate communication with the Radix Wallet and provides an easy-to-use interface over lower level APIs.

The current version only supports desktop browser webapps with requests made via the Radix Wallet Connector browser extension. It is intended to later add support for mobile browser webapps using deep linking with the same essential interface.

**RDT is composed of:**

- **√ Connect Button** – A framework agnostic web component that keeps a minimal internal state and have properties are pushed to it.

- **Tools** – Abstractions over lower level APIs for developers to build their radix dApps at lightning speed.

- **State management** – Handles wallet responses, caching and provides data to √ Connect button.

## Resources

### [Building a dApp frontend](https://docs-babylon.radixdlt.com/main/getting-started-developers/dapp-frontend/start.html)

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

```typescript
import { RadixDappToolkit } from '@radixdlt/radix-dapp-toolkit'

const rdt = RadixDappToolkit({
  dAppDefinitionAddress:
    'account_tdx_22_1pz7vywgwz4fq6e4v3aeeu8huamq0ctmsmzltay07vzpqm82mp5',
  networkId: 1,
})
```

**Input**

- **requires** dAppDefinitionAddress - Specifies the dApp that is interacting with the wallet. Used in dApp verification process on the wallet side. [Read more](#setting-up-your-dapp-definition)
- **requires** networkId - Target radix network ID.

## Wallet data

A data requests needs to be sent to the wallet in order to read wallet data.

There are two ways to trigger a data request:

1. By user action in the √ Connect button
2. Programmatically through `walletApi.sendRequest` method

#### Trigger wallet data request programmatically

```typescript
const result = await rdt.walletApi.sendRequest()

if (result.isError()) return handleException()

const walletData = result.value
```

### Change requested data

By default, a data request will ask the wallet for a persona login.

Use `walletApi.setRequestData` together with `DataRequestBuilder` to change the wallet data request.

```typescript
rdt.walletApi.setRequestData(
  DataRequestBuilder.accounts().exactly(1),
  DataRequestBuilder.personaData().fullName().emailAddresses()
)
```

### One Time Data Request

One Time data requests will always result in the Radix Wallet asking for the user's permission to share the data with the dApp. The wallet response from a one time data request is meant to be discarded after usage. A typical use case would be to populate a web-form with user data.

```typescript
const result = rdt.walletApi.sendOneTimeRequest(
  OneTimeDataRequestBuilder.accounts().exactly(1),
  OneTimeDataRequestBuilder.personaData().fullName()
)

if (result.isError()) return handleException()

const walletData = result.value
```

## State changes

Listen to wallet data changes by subscribing to `walletApi.walletData$`.

```typescript
const subscription = rdt.walletApi.walletData$.subscribe((walletData) => {
  doSomethingWithAccounts(walletData.accounts)
})
```

When your dApp is done listening to state changes remember to unsubscribe in order to prevent memory leaks.

```typescript
subscription.unsubscribe()
```

Get the latest wallet data by calling `walletApi.getWalletData()`.

```typescript
const walletData = rdt.walletApi.getWalletData()
```

## Send transaction

Your dApp can send transactions to the user's Radix Wallet for them to review, sign, and submit them to the Radix Network.

Radix transactions are built using "transaction manifests", that use a simple syntax to describe desired behavior. See [documentation on transaction manifest commands here](https://docs-babylon.radixdlt.com/main/scrypto/transaction-manifest/intro.html).

It is important to note that what your dApp sends to the Radix Wallet is actually a "transaction manifest stub". It is completed before submission by the Radix Wallet. For example, the Radix Wallet will automatically add a command to lock the necessary amount of network fees from one of the user's accounts. It may also add "assert" commands to the manifest according to user desires for expected returns.

**NOTE:** Information will be provided soon on a ["comforming" transaction manifest stub format](https://docs-babylon.radixdlt.com/main/standards/comforming-transactions.html) that ensures clear presentation and handling in the Radix Wallet.

### Build transaction manifest

We recommend using template strings for constructing simpler transaction manifests. If your dApp is sending complex manifests a manifest builder can be found in [TypeScript Radix Engine Toolkit](https://github.com/radixdlt/typescript-radix-engine-toolkit#building-manifests)

### sendTransaction

This sends the transaction manifest stub to a user's Radix Wallet, where it will be completed, presented to the user for review, signed as required, and submitted to the Radix network to be processed.

```typescript
type SendTransactionInput = {
  transactionManifest: string
  version: number
  blobs?: string[]
  message?: string
}
```

- **requires** transactionManifest - specify the transaction manifest
- **requires** version - specify the version of the transaction manifest
- **optional** blobs - used for deploying packages
- **optional** message - message to be included in the transaction

<details>

<summary>sendTransaction example</summary>

```typescript
const result = await rdt.walletApi.sendTransaction({
  version: 1,
  transactionManifest: '...',
})

if (result.isErr()) {
  // code to handle the exception
}

const transactionIntentHash = result.value.transactionIntentHash
```

</details>

## Login

A user is considered logged-in when a wallet data request is successfully resolved. For a frontend only dApp, that is all that is needed for the user to access all features of the dApp.

### User authentication

For a full-stack dApp there is also the user authentication flow. Typically, a full-stack dApp would request a persona together with a proof of ownership, which is then verified on the dApp backend using ROLA verification.

**What is a proof of ownership?**

A signature produced by the wallet used to verify that the wallet is in control of a persona or account.

```typescript
// Signed challenge
{
  type: 'persona' | 'account'
  challenge: string
  proof: {
    publicKey: string
    signature: string
    curve: 'curve25519' | 'secp256k1'
  }
  address: string
}
```

The signature is composed of:

|                                       |                                                                                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **prefix**                            | "R" (as in ROLA) in ascii encoding                                                                                                                   |
| **challenge**                         | 32 random bytes provided by the dApp                                                                                                                 |
| **length of dApp definition address** | String length of the dApp definition address                                                                                                         |
| **dApp definition address**           | The dApp definition address of the requesting dApp                                                                                                   |
| **origin**                            | The origin of the dApp (e.g. `https://dashboard.radixdlt.com`). This is a value that is added to the wallet data request by the Connector extension. |

**Challenge**

In order to request a persona or account with proof of ownership a challenge is needed.

A challenge is a random 32 bytes hex encoded string that looks something like: `4ccb0555d6b4faad0d7f5ed40bf4e4f0665c8ba35929c638e232e09775d0fa0e`

**Why do we need a challenge?**

The challenge plays an important role in the authentication flow, namely preventing replay attacks from bad actors. The challenge ensures that an authentication request payload sent from the client can only be used once. After a challenge is claimed by a request, the subsequent requests can no longer be resolved successfully with the same payload. As a security best practice, a stored challenge should have a short expiration time. In this case, just enough time for a user to interact with the wallet.

**Request persona with proof**

In order to request a proof, it is required to provide a function to RDT that produces a challenge.

```typescript
// type requestChallengeFromDappBackendFn = () => Promise<string>

rdt.walletApi.provideChallengeGenerator(requestChallengeFromDappBackendFn)

rdt.walletApi.setRequestData(DataRequestBuilder.persona.withProof())

rdt.walletApi.walletData$.subscribe((walletData) => {
  const personaProof = walletData.proofs.find(
    (proof) => proof.type === 'persona'
  )
  if (personaProof) handleLogin(personaProof)
})
```

See [ROLA example](https://github.com/radixdlt/rola-examples) for an end-to-end implementation.

### User authentication management

After a successful ROLA verification it is up to the dApp's business logic to handle user authentication session in order to keep the user logged-in between requests. Although RDT is persisting state between page reloads, it is not aware of user authentication. The dApp logic needs to control the login state and sign out a user when needed.

**Expired user auth session**

If a user's auth session has expired it is recommended to logout the user in RDT as well. The dApp needs to call the `disconnect` method in order to but the user in a **not connected** state.

```typescript
rdt.disconnect()
```

The `disconnect` method resets the RDT state, to login anew, a wallet data request needs to be triggered.

# ROLA (Radix Off-Ledger Authentication)

ROLA is method of authenticating something claimed by the user connected to your dApp with the Radix Wallet. It uses the capabilities of the Radix Network to make this possible in a way that is decentralized and flexible for the user.

ROLA is intended for use in the server backend portion of a Full Stack dApp. It runs "off-ledger" alongside backend business and user management logic, providing reliable authentication of claims of user control using "on-ledger" data from the Radix Network.

The primary use for ROLA is to authenticate the user's Persona login with the user's control of account(s) on Radix. Let's say that Alice is subscribed to an online streaming service on the Radix network called Radflix, which requires a subscription badge to enter the website. Alice logs in with her Persona to Radflix and now needs to prove that she owns an account that contains a Radflix subscription badge. By using Rola we can verify that Alice is the owner of the account that contains the Radflix subscription badge. Once we have verified that Alice is the owner of the account, we can then use the account to check for the Radflix subscription badge and verify that Alice has a valid subscription.

**Read more**

- [ROLA example](https://github.com/radixdlt/rola-examples)
- [Full-stack dApp](https://docs-babylon.radixdlt.com/main/getting-started-developers/dapp-backend/building-a-full-stack-dapp.html)

# √ Connect Button

Provides a consistent and delightful user experience between radix dApps. Although complex by itself, RDT is off-loading the developer burden of having to handle the logic of all its internal states.

Just add the HTML element in your code, and you're all set.

```html
<radix-connect-button />
```

Currently you as the developer have no control over the styling. A complete make-over is coming shortly with more customization options to fit your dApp's branding needs.

# Setting up your dApp Definition

A dApp Definition account should be created after you’ve built your dApp’s components and resources, and created a website front end for it. dApp Definition account is a special account on the Radix Network with some metadata set on it that does some nice things, like:

- Provides the necessary unique identifier (the dApp Definition’s address) that the Radix Wallet needs to let users login to your dApp and save sharing preferences for it.

- Defines things like name, description, and icon so the Radix Wallet can inform users what they are interacting with.

- Lets you link together everything associated with your dApp – like websites, resources, and components – so that the Radix Wallet knows what they all belong to.

Creating a dApp Definition for your dApp will provide the necessary information for clients like the Radix Wallet to let users interact with your dApp in a way that is easy, safe, and informative. It also acts as a hub that connects all your dApp pieces together.

You can read more about dApp Definitions [here](https://docs-babylon.radixdlt.com/main/standards/metadata-for-verification.html).

## Setting up a dApp Definition on the Radix Dashboard

1. **Create a new account in the Radix Wallet.** This is the account which we will convert to a dApp Definition account.

2. **Head to the Radix Dashboard’s Manage dApp Definitions page**. This page provides a simple interface to set the metadata on an account to make it a dApp Definition.

3. **Connect your Radix Wallet to the Dashboard** and make sure you share the account that you just created to be a dApp Definition. Select that account on the Dashboard page.

4. **Now check the box for “Set this account as a dApp Definition”, and fill in the name and description you want to use for your dApp.** Later you’ll also be able to specify an icon image, but that’s not ready just yet.

5. **Click “Update”** and an approve transaction should appear in your Radix Wallet. Done!

Provide account address as the the dApp Definition address that you just created, and it will be sent to the Radix Wallet whenever a user connects or receives a transaction from your dApp. The Wallet will then look up that dApp Definition address on the Radix Network, pull the latest metadata, and show it to the user. When a user logins to your dApp, an entry in the wallet’s preferences for your dApp will appear too. Try it out for yourself!

# Data storage

To provide a consistent user experience RDT stores data to the browser’s local storage. This will enable state rehydration and keep state between page reloads.

To understand which wallet responses that get stored we need to understand the difference between one-time and regular data requests.

One-time data requests do not register the dApp in the wallet and the connect button does not display that data in the UI. The data is meant to be used temporarily by the dApp and discarded thereafter.

A user connecting her wallet will be the first user flow in the majority of dApps. The connect flow is a bit different from subsequent data request flows. Its purpose is to provide the dApp with a minimal amount of user data in order for the user to be able to use the dApp, e.g. the minimal amount of data for a DEX dApp is an account.

RDT handles writing and reading data to the browser’s local storage so that it will be persisted between page loads. The dApp frontend logic can at any time ask RDT to provide the stored data by subscribing to the `walletApi.walletData$` observable or calling `walletApi.getWalletData`. One time data requests or requests that can not be resolved by the internal state are sent as data requests to the wallet.

# Examples

The `examples` directory contains a react dApp that consumes RDT. Its main purpose is to be used by us internally for debugging but can also serve as a source of inspiration.
