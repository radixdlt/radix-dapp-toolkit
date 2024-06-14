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
})
