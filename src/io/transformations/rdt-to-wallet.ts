import {
  AuthLoginWithChallengeRequestItem,
  AuthLoginWithoutChallengeRequestItem,
  AuthUsePersonaRequestItem,
  Persona,
  WalletAuthorizedRequestItems,
  WalletUnauthorizedRequestItems,
} from '@radixdlt/wallet-sdk'
import {
  ConnectButtonDataRequestInput,
  DataRequestInput,
  RdtState,
} from '../schemas'
import { Result, ok } from 'neverthrow'

export type TransformRdtDataRequestToWalletRequestInput =
  | { isConnect: true; data: ConnectButtonDataRequestInput }
  | { isConnect: false; data: DataRequestInput }

const isAuthorized = (
  input: TransformRdtDataRequestToWalletRequestInput
): boolean => {
  if (input.isConnect) return true

  const { challenge, accounts, personaData } = input.data

  const requiresChallengeSigning = !!challenge
  const shouldResetData = accounts?.reset || personaData?.reset
  const isOngoingAccountsRequest = !accounts?.oneTime
  const isOngoingPersonaDataRequest = !personaData?.oneTime

  const isAuthorizedRequest = !!(
    requiresChallengeSigning ||
    shouldResetData ||
    isOngoingAccountsRequest ||
    isOngoingPersonaDataRequest
  )

  return isAuthorizedRequest
}

const createLoginRequestItem = (
  input: TransformRdtDataRequestToWalletRequestInput,
  persona?: Persona
) => {
  if (input.data.challenge) {
    return {
      discriminator: 'loginWithChallenge',
      challenge: input.data.challenge,
    } satisfies AuthLoginWithChallengeRequestItem
  }

  if (persona?.identityAddress) {
    return {
      discriminator: 'usePersona',
      identityAddress: persona?.identityAddress,
    } satisfies AuthUsePersonaRequestItem
  }

  return {
    discriminator: 'loginWithoutChallenge',
  } satisfies AuthLoginWithoutChallengeRequestItem
}

const withAccountRequestItem =
  (input: TransformRdtDataRequestToWalletRequestInput) =>
  <T extends WalletUnauthorizedRequestItems | WalletAuthorizedRequestItems>(
    requestItems: T
  ) => {
    const updatedRequestItems = { ...requestItems }
    const { accounts } = input.data

    if (accounts) {
      const data = {
        challenge: accounts.challenge,
        numberOfAccounts: {
          quantifier: accounts.quantifier,
          quantity: accounts.quantity,
        },
      }
      if (!input.isConnect && input.data.accounts?.oneTime) {
        updatedRequestItems['oneTimeAccounts'] = data
      }

      const isOngoingRequest =
        !input.isConnect &&
        updatedRequestItems.discriminator === 'authorizedRequest' &&
        !input.data.accounts?.oneTime

      const isConnectOngoingRequest =
        input.isConnect &&
        updatedRequestItems.discriminator === 'authorizedRequest'

      if (isOngoingRequest || isConnectOngoingRequest)
        updatedRequestItems['ongoingAccounts'] = data
    }
    return ok<T, never>(updatedRequestItems)
  }

const withPersonaDataRequestItem =
  (input: TransformRdtDataRequestToWalletRequestInput) =>
  <T extends WalletUnauthorizedRequestItems | WalletAuthorizedRequestItems>(
    requestItems: T
  ) => {
    const updatedRequestItems = { ...requestItems }
    const { personaData } = input.data

    if (personaData) {
      const data = {
        fields: personaData.fields,
      }

      if (!input.isConnect && input.data.personaData?.oneTime)
        updatedRequestItems['oneTimePersonaData'] = data

      if (updatedRequestItems.discriminator === 'authorizedRequest')
        updatedRequestItems['ongoingPersonaData'] = data
    }
    return ok(updatedRequestItems)
  }

const withResetRequestItem =
  (input: TransformRdtDataRequestToWalletRequestInput) =>
  (requestItems: WalletAuthorizedRequestItems) => {
    if (input.isConnect) return ok(requestItems)
    const { accounts, personaData } = input.data
    return ok<WalletAuthorizedRequestItems, never>({
      ...requestItems,
      reset: { accounts: !!accounts?.reset, personaData: !!personaData?.reset },
    })
  }

const createUnauthorizedRequestItems = (
  input: TransformRdtDataRequestToWalletRequestInput
): Result<WalletUnauthorizedRequestItems, never> =>
  ok<WalletUnauthorizedRequestItems, never>({
    discriminator: 'unauthorizedRequest',
  })
    .andThen(withAccountRequestItem(input))
    .andThen(withPersonaDataRequestItem(input))

const createAuthorizedRequestItems = (
  input: TransformRdtDataRequestToWalletRequestInput,
  persona: RdtState['walletData']['persona']
): Result<WalletAuthorizedRequestItems, never> =>
  ok<WalletAuthorizedRequestItems, never>({
    discriminator: 'authorizedRequest',
    auth: createLoginRequestItem(input, persona),
  })
    .andThen(withAccountRequestItem(input))
    .andThen(withPersonaDataRequestItem(input))
    .andThen(withResetRequestItem(input))

export const transformRdtDataRequestToWalletRequest = <
  T extends TransformRdtDataRequestToWalletRequestInput
>(
  input: T,
  state: RdtState
): Result<
  WalletUnauthorizedRequestItems | WalletAuthorizedRequestItems,
  never
> => {
  return isAuthorized(input)
    ? createAuthorizedRequestItems(input, state.walletData.persona)
    : createUnauthorizedRequestItems(input)
}
