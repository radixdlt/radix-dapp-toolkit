export const ErrorType = {
  rejectedByUser: 'rejectedByUser',
  missingExtension: 'missingExtension',
  canceledByUser: 'canceledByUser',
  walletRequestValidation: 'walletRequestValidation',
  walletResponseValidation: 'walletResponseValidation',
  wrongNetwork: 'wrongNetwork',
  failedToPrepareTransaction: 'failedToPrepareTransaction',
  failedToCompileTransaction: 'failedToCompileTransaction',
  failedToSignTransaction: 'failedToSignTransaction',
  failedToSubmitTransaction: 'failedToSubmitTransaction',
  failedToPollSubmittedTransaction: 'failedToPollSubmittedTransaction',
  submittedTransactionWasDuplicate: 'submittedTransactionWasDuplicate',
  submittedTransactionHasFailedTransactionStatus:
    'submittedTransactionHasFailedTransactionStatus',
  submittedTransactionHasRejectedTransactionStatus:
    'submittedTransactionHasRejectedTransactionStatus',
  failedToFindAccountWithEnoughFundsToLockFee:
    'failedToFindAccountWithEnoughFundsToLockFee',
  wrongAccountType: 'wrongAccountType',
  unknownWebsite: 'unknownWebsite',
  radixJsonNotFound: 'radixJsonNotFound',
  unknownDappDefinitionAddress: 'unknownDappDefinitionAddress',
  invalidPersona: 'invalidPersona',
} as const

type ErrorType = keyof typeof ErrorType

const defaultErrorMessage = new Map<string, string>()
  .set(ErrorType.missingExtension, 'extension could not be found')
  .set(ErrorType.rejectedByUser, 'user rejected request')
  .set(ErrorType.canceledByUser, 'user has canceled the request')

export type SdkError = {
  error: string
  interactionId: string
  message?: string
  jsError?: unknown
}

export const SdkError = (
  error: string,
  interactionId: string,
  message?: string,
  jsError?: unknown,
): SdkError => ({
  error,
  interactionId,
  message: message || defaultErrorMessage.get(error) || '',
  jsError,
})
