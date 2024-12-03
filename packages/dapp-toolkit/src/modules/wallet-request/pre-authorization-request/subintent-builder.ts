import { SubintentRequestItem } from '../../../schemas'

export type BuildableSubintentRequest = {
  toRequestItem: () => SubintentRequestItem
  getOnSubmittedSuccessFn?: () => (transactionIntentHash: string) => void
}
/**
 * A builder function for creating a SubintentRequest.
 *
 * @returns An object with methods to configure and build a SubintentRequestItem.
 *
 * @example
 * const builder = SubintentRequestBuilder();
 * const requestItem = builder
 *   .manifest('some-manifest')
 *   .setExpiration('atTime', 1234567890)
 *   .addBlobs('blob1', 'blob2')
 *   .message('This is a message')
 *   .onSubmittedSuccess(() => console.log('Submitted successfully'))
 */
export const SubintentRequestBuilder = () => {
  let state: Partial<SubintentRequestItem> = {
    discriminator: 'subintent',
    version: 1,
    manifestVersion: 2,
  }
  let onSubmittedSuccessFn: (transactionIntentHash: string) => void

  /**
   * Adds a callback to be called when the preauthorization is included in successfully committed on ledger transaction.
   * This will be called with the committed transaction intent hash.
   *
   * @param callback - function to be called when the preauthorization is included in successfully committed on ledger transaction
   * @returns The API object for chaining.
   */
  const onSubmittedSuccess = (
    callback: (transactionIntentHash: string) => void,
  ) => {
    onSubmittedSuccessFn = callback
    return api
  }

  /**
   * Sets the expiration for a request.
   *
   * @param type - The type of expiration. Can be 'atTime' for a specific time or 'afterDelay' for a duration after the signature.
   * @param value - The value associated with the expiration type. For 'atTime', this is a timestamp. For 'afterDelay', this is the number of seconds.
   * @returns The API object for chaining.
   */
  const setExpiration = (type: 'atTime' | 'afterDelay', value: number) => {
    state.expiration =
      type === 'atTime'
        ? {
            discriminator: 'expireAtTime',
            unixTimestampSeconds: value,
          }
        : {
            discriminator: 'expireAfterDelay',
            expireAfterSeconds: value,
          }
    return api
  }

  /**
   * Adds the provided blobs to the state.
   *
   * @param blobs - A list of blob strings to be added to the state.
   * @returns The API object for chaining.
   */
  const addBlobs = (...blobs: string[]) => {
    state.blobs = blobs
    return api
  }

  /**
   * Sets the message to be included in the subintent transaction.
   *
   * @param message - The message to be set in the state.
   * @returns The API object for chaining further calls.
   */
  const message = (message: string) => {
    state.message = message
    return api
  }

  /**
   * Sets the transaction manifest in the state and returns the API object.
   *
   * @param value - The transaction manifest to be set.
   * @returns The API object for method chaining.
   */
  const manifest = (value: string) => {
    state.subintentManifest = value
    return { setExpiration }
  }

  /**
   * Converts the current state to a SubintentRequestItem.
   *
   * @returns {SubintentRequestItem} The current state cast as a SubintentRequestItem.
   */
  const toRequestItem = () => state as SubintentRequestItem

  /**
   * Sets the raw configuration for the builder.
   *
   * @param rawConfig - The raw configuration to set.
   * @returns The API object for method chaining.
   */
  const rawConfig = (
    rawConfig: Omit<SubintentRequestItem, 'discriminator'>,
  ) => {
    state = { ...rawConfig, discriminator: 'subintent' }
    return { toRequestItem }
  }

  const api = {
    addBlobs,
    message,
    toRequestItem,
    onSubmittedSuccess,
    getOnSubmittedSuccessFn: () => onSubmittedSuccessFn,
  } as const

  return { manifest, rawConfig }
}
