import { describe, expect, it } from 'vitest'
import { SubintentRequestBuilder } from './subintent-builder'

describe('SubintentRequestBuilder', () => {
  it('should build a subintent request', () => {
    const tx = SubintentRequestBuilder()
      .manifest('...')
      .setExpiration('secondsAfterSignature', 60)
      .addBlobs('deadbeef', 'beefdead')
      .message('hello')
      .toRequestItem()

    expect(tx).toEqual({
      discriminator: 'subintent',
      version: 1,
      transactionManifestVersion: 1,
      transactionManifest: '...',
      expiration: {
        discriminator: 'expireAfterSignature',
        value: 60,
      },
      blobs: ['deadbeef', 'beefdead'],
      message: 'hello',
    })
  })

  it('should build a subintent request using raw object', () => {
    const tx = SubintentRequestBuilder()
      .rawConfig({
        version: 1,
        transactionManifestVersion: 1,
        transactionManifest: '...',
        expiration: {
          discriminator: 'expireAfterSignature',
          value: 60,
        },
        blobs: ['deadbeef', 'beefdead'],
        message: 'hello',
      })
      .toRequestItem()

    expect(tx).toEqual({
      discriminator: 'subintent',
      version: 1,
      transactionManifestVersion: 1,
      transactionManifest: '...',
      expiration: {
        discriminator: 'expireAfterSignature',
        value: 60,
      },
      blobs: ['deadbeef', 'beefdead'],
      message: 'hello',
    })
  })
})
