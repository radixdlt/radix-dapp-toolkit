import { describe, expect, it } from 'vitest'
import { EncryptionModule } from './encryption.module'

describe('encryption module', () => {
  const encryptionModule = EncryptionModule()

  it('should encrypt data', async () => {
    const data = Buffer.from('data')
    const encryptionKey = Buffer.from('12345678901234567890123456789012')
    const result = await encryptionModule
      .encrypt(data, encryptionKey, encryptionModule.createIV())
      .map((value) => {
        expect(value).toBeDefined()
      })

    expect(result.isOk()).toBeTruthy()
  })

  it('should return error for invalid key length', async () => {
    const data = Buffer.from('data')
    const encryptionKey = Buffer.from('key')
    const result = await encryptionModule.encrypt(
      data,
      encryptionKey,
      encryptionModule.createIV(),
    )
    expect(result.isErr()).toBeTruthy()
  })

  it('should return 12 bytes IV', () => {
    const iv = encryptionModule.createIV()
    expect(iv.length).toBe(12)
  })

  it('should decrypt previously encrypted data', async () => {
    const data = Buffer.from('data')
    const encryptionKey = Buffer.from('12345678901234567890123456789012')
    const iv = encryptionModule.createIV()
    const result = await encryptionModule
      .encrypt(data, encryptionKey, iv)
      .andThen((sealed) =>
        encryptionModule.decrypt(sealed.ciphertext, encryptionKey, iv),
      )
      .map((decrypted) =>
        expect(decrypted.toString('hex')).toEqual(data.toString('hex')),
      )
    expect(result.isOk()).toBeTruthy()
  })
})
