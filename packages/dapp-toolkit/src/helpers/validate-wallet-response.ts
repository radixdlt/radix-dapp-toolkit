import { Result, ResultAsync, errAsync, okAsync } from 'neverthrow'
import {
  WalletInteractionResponse,
  WalletInteractionSuccessResponse,
} from '../schemas'
import { SdkError } from '../error'
import { parse } from 'valibot'

export const validateWalletResponse = (
  walletResponse: unknown,
): ResultAsync<
  WalletInteractionSuccessResponse,
  SdkError | { discriminator: 'failure'; interactionId: string; error: string }
> => {
  const fn = Result.fromThrowable(
    (_) => parse(WalletInteractionResponse, _),
    (error) => error,
  )

  const result = fn(walletResponse)
  if (result.isErr()) {
    return errAsync(SdkError('walletResponseValidation', '', 'Invalid input'))
  } else if (result.isOk()) {
    return result.value.discriminator === 'success'
      ? okAsync(result.value)
      : errAsync(result.value)
  }

  return errAsync(SdkError('walletResponseValidation', ''))
}
