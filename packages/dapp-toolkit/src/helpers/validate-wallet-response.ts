import { Result } from 'neverthrow'
import { WalletInteractionResponse } from '../schemas'
import { SdkError } from '../error'
import { parse } from 'valibot'

export const validateWalletResponse = (
  walletResponse: unknown,
): Result<WalletInteractionResponse, SdkError> => {
  const fn = Result.fromThrowable(
    (_) => parse(WalletInteractionResponse, _),
    (error) => error,
  )

  return fn(walletResponse).mapErr((response) =>
    SdkError(
      'walletResponseValidation',
      (walletResponse as any)?.interactionId,
      'Invalid input',
      response,
    ),
  )
}
