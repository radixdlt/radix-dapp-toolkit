import { ResultAsync } from 'neverthrow'
import { WalletInteraction, WalletInteractionResponse } from '../../../schemas'
import { SdkError } from '../../../error'
import { RequestItem } from 'radix-connect-common'

export type WalletResponseResolverInput = {
  walletInteraction: WalletInteraction
  walletInteractionResponse: WalletInteractionResponse
  requestItem: RequestItem
}

export type WalletResponseResolver = (
  input: WalletResponseResolverInput,
) => ResultAsync<undefined, SdkError>

export type UpdateConnectButtonStatus = (status: 'fail' | 'success') => void
