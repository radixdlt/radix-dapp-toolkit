import { Result, ResultAsync, errAsync, okAsync } from 'neverthrow'
import {
  WalletInteractionResponse,
  WalletInteractionSuccessResponse,
} from '../schemas'
import { SdkError } from '../error'
import { ValiError, parse } from 'valibot'

export const validateWalletResponse = (
  walletResponse: unknown,
): ResultAsync<WalletInteractionSuccessResponse, SdkError> => {
  const fn = Result.fromThrowable(
    (_) => parse(WalletInteractionResponse, _),
    (error) => error as ValiError,
  )

  const result = fn(walletResponse)
  if (result.isErr()) {
    return errAsync(SdkError('walletResponseValidation', '', 'Invalid input'))
  } else if (result.isOk()) {
    return result.value.discriminator === 'success'
      ? okAsync(result.value)
      : errAsync(result.value as any)
  }

  return errAsync(SdkError('walletResponseValidation', ''))
}
