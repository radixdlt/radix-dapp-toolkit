import { describe, expect, it } from 'vitest'
import { transformBufferToSealbox } from './sealbox'

describe('transformBufferToSealbox', () => {
  it('should transform buffer to sealbox', async () => {
    const buf = Buffer.from(
      'aaaaaaaaaaaaaaaaaaaaaaaaccbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'hex',
    )
    const result = await transformBufferToSealbox(buf)

    expect(result.isOk() && JSON.stringify(result.value)).toEqual(
      JSON.stringify({
        iv: Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaa', 'hex'),
        ciphertext: Buffer.from('cc', 'hex'),
        authTag: Buffer.from('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'hex'),
        combined: buf,
        ciphertextAndAuthTag: Buffer.from(
          'ccbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          'hex',
        ),
      }),
    )
  })
})
