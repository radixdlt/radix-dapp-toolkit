import { SubintentRequestItem } from '../../../schemas'

export type BuildableSubintentRequest = {
  toRequestItem: () => SubintentRequestItem
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
 *
 * @method setExpiration
 * Sets the expiration for the subintent request.
 *
 * @param type - The type of expiration, either 'atTime' or 'secondsAfterSignature'.
 * @param value - The value of the expiration. If type is 'atTime', this is a Unix timestamp. If type is 'secondsAfterSignature', this is the number of seconds after the signature is created.
 * @returns The API object for chaining.
 *
 * @method addBlobs
 * Adds blobs to the subintent request.
 *
 * @param values - The blobs to add.
 * @returns The API object for chaining.
 *
 * @method message
 * Sets a message for the subintent request.
 *
 * @param value - The message to set.
 * @returns The API object for chaining.
 *
 * @method manifest
 * Sets the transaction manifest for the subintent request.
 *
 * @param value - The transaction manifest to set.
 * @returns The API object for chaining.
 *
 * @method toRequestItem
 * Converts the current state to a SubintentRequestItem.
 *
 * @returns The SubintentRequestItem.
 *
 * @method rawConfig
 * Sets the raw configuration for the subintent request.
 *
 * @param rawConfig - The raw configuration object, excluding the discriminator.
 * @returns An object with the toRequestItem method.
 */
export const SubintentRequestBuilder = () => {
  let state: Partial<SubintentRequestItem> = {
    discriminator: 'subintent',
    version: 1,
    transactionManifestVersion: 1,
  }

  const setExpiration = (
    type: 'atTime' | 'secondsAfterSignature',
    value: number,
  ) => {
    state.expiration = {
      discriminator:
        type === 'atTime' ? 'expireAtTime' : 'expireAfterSignature',
      value,
    }
    return api
  }

  const addBlobs = (...values: string[]) => {
    state.blobs = values
    return api
  }

  const message = (value: string) => {
    state.message = value
    return api
  }

  const manifest = (value: string) => {
    state.transactionManifest = value
    return api
  }

  const toRequestItem = () => state as SubintentRequestItem

  const rawConfig = (
    rawConfig: Omit<SubintentRequestItem, 'discriminator'>,
  ) => {
    state = { ...rawConfig, discriminator: 'subintent' }
    return { toRequestItem }
  }

  const api = {
    setExpiration,
    addBlobs,
    message,
    toRequestItem,
  } as const

  return { manifest, rawConfig }
}
