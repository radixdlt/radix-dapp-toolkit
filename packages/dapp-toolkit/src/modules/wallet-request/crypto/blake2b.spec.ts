import { describe, expect, it } from 'vitest'
import { blake2b } from './blake2b'

describe('blake2b', () => {
  it('should hash a string', async () => {
    const result = blake2b(Buffer.from('test'))

    if (result.isErr()) throw result.error

    expect(result.value.toString('hex')).toBe(
      '928b20366943e2afd11ebc0eae2e53a93bf177a4fcf35bcc64d503704e65e202',
    )
  })

  it('should generate an array of blake2b hashes', async () => {
    const vectors = new Array(100).fill(null).map(() => {
      const buffer = Buffer.from(crypto.getRandomValues(new Uint8Array(64)))
      const blake2bHash = blake2b(buffer)._unsafeUnwrap().toString('hex')
      const message = buffer.toString('hex')
      return { message, blake2bHash }
    })
  })
})
