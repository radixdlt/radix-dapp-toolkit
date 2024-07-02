export const encodeBase64 = (data: string) => {
  if (typeof btoa === 'function') {
    return btoa(data)
  } else if (typeof Buffer === 'function') {
    return Buffer.from(data, 'utf-8').toString('base64')
  } else {
    throw new Error('Failed to determine the platform specific encoder')
  }
}
