import {
  AuthLoginWithChallengeRequestItem,
  AuthLoginWithoutChallengeRequestItem,
  AuthUsePersonaRequestItem,
  NumberOfValues,
  WalletAuthorizedRequestItems,
  WalletUnauthorizedRequestItems,
} from '@radixdlt/wallet-sdk'
import { produce } from 'immer'
import { Result, ok } from 'neverthrow'
import { boolean, object, string, z } from 'zod'

export type TransformRdtDataRequestToWalletRequestInput = z.infer<
  typeof TransformRdtDataRequestToWalletRequestInput
>
export const TransformRdtDataRequestToWalletRequestInput = object({
  accounts: object({
    numberOfAccounts: NumberOfValues,
    reset: boolean(),
    oneTime: boolean(),
    challenge: string().optional(),
  }).optional(),
  personaData: object({
    isRequestingName: boolean().optional(),
    numberOfRequestedPhoneNumbers: NumberOfValues.optional(),
    numberOfRequestedEmailAddresses: NumberOfValues.optional(),
    reset: boolean(),
    oneTime: boolean().optional(),
  }).optional(),
  persona: object({
    identityAddress: string().optional(),
    label: string().optional(),
    challenge: string().optional(),
  }).optional(),
})

const isAuthorized = (
  input: TransformRdtDataRequestToWalletRequestInput
): boolean => {
  const { persona, accounts, personaData } = input

  const isPersonaLogin = !!persona
  const shouldResetData = accounts?.reset || personaData?.reset
  const isOngoingAccountsRequest = accounts && !accounts?.oneTime
  const isOngoingPersonaDataRequest = personaData && !personaData?.oneTime

  const isAuthorizedRequest = !!(
    shouldResetData ||
    isOngoingAccountsRequest ||
    isOngoingPersonaDataRequest ||
    isPersonaLogin
  )

  return isAuthorizedRequest
}

const createLoginRequestItem = (
  input: TransformRdtDataRequestToWalletRequestInput
) => {
  if (input.persona?.challenge) {
    return {
      discriminator: 'loginWithChallenge',
      challenge: input.persona.challenge,
    } satisfies AuthLoginWithChallengeRequestItem
  }

  if (input.persona?.identityAddress) {
    return {
      discriminator: 'usePersona',
      identityAddress: input.persona?.identityAddress,
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
    const { accounts } = input

    if (accounts) {
      const data = {
        challenge: accounts.challenge,
        numberOfAccounts: accounts.numberOfAccounts,
      }
      const isOngoingRequest =
        updatedRequestItems.discriminator === 'authorizedRequest' &&
        !input.accounts?.oneTime

      const isConnectOngoingRequest =
        updatedRequestItems.discriminator === 'authorizedRequest'

      if (input.accounts?.oneTime) {
        updatedRequestItems['oneTimeAccounts'] = data
      } else if (isOngoingRequest || isConnectOngoingRequest) {
        updatedRequestItems['ongoingAccounts'] = data
      }
    }
    return updatedRequestItems
  }

const withPersonaDataRequestItem =
  (input: TransformRdtDataRequestToWalletRequestInput) =>
  <T extends WalletUnauthorizedRequestItems | WalletAuthorizedRequestItems>(
    requestItems: T
  ) => {
    const updatedRequestItems = { ...requestItems }

    if (input.personaData) {
      const {
        isRequestingName,
        numberOfRequestedPhoneNumbers,
        numberOfRequestedEmailAddresses,
      } = input.personaData

      if (input.personaData?.oneTime) {
        updatedRequestItems['oneTimePersonaData'] = {
          isRequestingName,
          numberOfRequestedPhoneNumbers,
          numberOfRequestedEmailAddresses,
        }
      }

      const isOngoingRequest =
        updatedRequestItems.discriminator === 'authorizedRequest' &&
        !input.personaData?.oneTime

      const isConnectOngoingRequest =
        updatedRequestItems.discriminator === 'authorizedRequest'

      if (isOngoingRequest || isConnectOngoingRequest) {
        updatedRequestItems['ongoingPersonaData'] = {
          isRequestingName,
          numberOfRequestedPhoneNumbers,
          numberOfRequestedEmailAddresses,
        }
      }
    }
    return updatedRequestItems
  }

const withResetRequestItem =
  (input: TransformRdtDataRequestToWalletRequestInput) =>
  (requestItems: WalletAuthorizedRequestItems) => {
    const { accounts, personaData } = input
    return {
      ...requestItems,
      reset: { accounts: !!accounts?.reset, personaData: !!personaData?.reset },
    }
  }

const createUnauthorizedRequestItems = (
  input: TransformRdtDataRequestToWalletRequestInput
): Result<WalletUnauthorizedRequestItems, never> =>
  ok<WalletUnauthorizedRequestItems, never>({
    discriminator: 'unauthorizedRequest',
  })
    .map(withAccountRequestItem(input))
    .map(withPersonaDataRequestItem(input))

const createAuthorizedRequestItems = (
  input: TransformRdtDataRequestToWalletRequestInput
): Result<WalletAuthorizedRequestItems, never> =>
  ok<WalletAuthorizedRequestItems, never>({
    discriminator: 'authorizedRequest',
    auth: createLoginRequestItem(input),
  })
    .map(withAccountRequestItem(input))
    .map(withPersonaDataRequestItem(input))
    .map(withResetRequestItem(input))

const transformConnectRequest = (
  isConnect: boolean,
  input: TransformRdtDataRequestToWalletRequestInput
): Result<TransformRdtDataRequestToWalletRequestInput, never> =>
  ok(
    isConnect
      ? produce(input, (draft) => {
          if (draft.accounts) {
            draft.accounts.oneTime = false
            draft.accounts.reset = false
          }

          if (draft.personaData) {
            draft.personaData.oneTime = false
            draft.personaData.reset = false
          }
        })
      : input
  )

export const transformRdtDataRequestToWalletRequest = (
  isConnect: boolean,
  input: TransformRdtDataRequestToWalletRequestInput
): Result<
  WalletUnauthorizedRequestItems | WalletAuthorizedRequestItems,
  never
> =>
  transformConnectRequest(isConnect, input).andThen((transformed) =>
    isAuthorized(transformed)
      ? createAuthorizedRequestItems(transformed)
      : createUnauthorizedRequestItems(transformed)
  )
