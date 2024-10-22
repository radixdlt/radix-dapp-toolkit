/**
 * Checks if the provided object is a Telegram Mobile App (TMA) global object.
 *
 * @param maybeTgGlobalObject - The object to check.
 * @returns `true` if the object has WebView initialization parameters, otherwise `false`.
 */
export const isTMA = (globalObject: any) =>
  Object.keys(globalObject?.Telegram?.WebView?.initParams || {}).length > 0
