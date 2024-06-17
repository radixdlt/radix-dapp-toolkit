import base64url from 'base64url'

export const base64urlEncode = <T extends Record<string, any>>(
  value: T,
): string => base64url.encode(Buffer.from(JSON.stringify(value)))
