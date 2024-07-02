import { Buffer } from 'buffer'

export default () => {
  if (!globalThis.Buffer) globalThis.Buffer = Buffer
}
