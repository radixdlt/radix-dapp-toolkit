import { Buffer } from 'buffer'

export const decodeStateFromUrlHash = () => {
  try {
    const hash = window.location.hash
    if (hash) {
      const stringified = Buffer.from(hash.slice(1), 'base64').toString()
      const parsed = JSON.parse(stringified)
      return typeof parsed === 'object' ? parsed : {}
    }
  } catch (_) {
    return {}
  }
}

export const encodeStateToUrlHash = (key: string, data: any) => {
  const currentState = decodeStateFromUrlHash()
  const base64 = Buffer.from(
    JSON.stringify({ ...currentState, [key]: data })
  ).toString('base64')
  window.location.hash = base64
}
