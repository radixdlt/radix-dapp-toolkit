import { describe, expect, it } from 'vitest'
import { SubintentRequestBuilder } from './subintent-builder'

describe('SubintentRequestBuilder', () => {
  it('should build a subintent request', () => {
    const tx = SubintentRequestBuilder()
      .manifest('...')
      .setExpiration('afterDelay', 60)
      .addBlobs('deadbeef', 'beefdead')
      .message('hello')
      .toRequestItem()

    expect(tx).toEqual({
      discriminator: 'subintent',
      version: 1,
      manifestVersion: 2,
      subintentManifest: '...',
      expiration: {
        discriminator: 'expireAfterDelay',
        expireAfterSeconds: 60,
      },
      blobs: ['deadbeef', 'beefdead'],
      message: 'hello',
    })
  })

  it('should build a subintent request with expiration at time', () => {
    const tx = SubintentRequestBuilder()
      .manifest('...')
      .setExpiration('atTime', 1970)
      .toRequestItem()

    expect(tx).toEqual({
      discriminator: 'subintent',
      version: 1,
      manifestVersion: 2,
      subintentManifest: '...',
      expiration: {
        discriminator: 'expireAtTime',
        unixTimestampSeconds: 1970,
      },
    })
  })

  it('should build a subintent request using raw object', () => {
    const tx = SubintentRequestBuilder()
      .rawConfig({
        version: 1,
        manifestVersion: 2,
        subintentManifest: '...',
        expiration: {
          discriminator: 'expireAfterDelay',
          expireAfterSeconds: 60,
        },
        blobs: ['deadbeef', 'beefdead'],
        message: 'hello',
      })
      .toRequestItem()

    expect(tx).toEqual({
      discriminator: 'subintent',
      version: 1,
      manifestVersion: 2,
      subintentManifest: '...',
      expiration: {
        discriminator: 'expireAfterDelay',
        expireAfterSeconds: 60,
      },
      blobs: ['deadbeef', 'beefdead'],
      message: 'hello',
    })
  })

  it('should build a subintent request with a header', () => {
    const tx = SubintentRequestBuilder()
      .manifest('...')
      .header({
        startEpochInclusive: 100,
        endEpochExclusive: 200,
        minProposerTimestampInclusive: 1000,
        maxProposerTimestampExclusive: 2000,
        intentDiscriminator: 42,
      })
      .setExpiration('afterDelay', 60)
      .toRequestItem()

    expect(tx).toEqual({
      discriminator: 'subintent',
      version: 1,
      manifestVersion: 2,
      subintentManifest: '...',
      expiration: {
        discriminator: 'expireAfterDelay',
        expireAfterSeconds: 60,
      },
      header: {
        startEpochInclusive: 100,
        endEpochExclusive: 200,
        minProposerTimestampInclusive: 1000,
        maxProposerTimestampExclusive: 2000,
        intentDiscriminator: 42,
      },
    })
  })

  it('should build a subintent request with a header and no expiration', () => {
    const tx = SubintentRequestBuilder()
      .manifest('...')
      .header({
        startEpochInclusive: 100,
        endEpochExclusive: 200,
        minProposerTimestampInclusive: 1000,
        maxProposerTimestampExclusive: 2000,
        intentDiscriminator: 42,
      })
      .toRequestItem()

    expect(tx).toEqual({
      discriminator: 'subintent',
      version: 1,
      manifestVersion: 2,
      subintentManifest: '...',
      header: {
        startEpochInclusive: 100,
        endEpochExclusive: 200,
        minProposerTimestampInclusive: 1000,
        maxProposerTimestampExclusive: 2000,
        intentDiscriminator: 42,
      },
    })
  })

  it('should build a subintent request with a header via rawConfig', () => {
    const tx = SubintentRequestBuilder()
      .rawConfig({
        version: 1,
        manifestVersion: 2,
        subintentManifest: '...',
        expiration: {
          discriminator: 'expireAtTime',
          unixTimestampSeconds: 1970,
        },
        header: {
          networkId: 2,
          startEpochInclusive: 50,
          endEpochExclusive: 150,
          intentDiscriminator: 99,
        },
      })
      .toRequestItem()

    expect(tx).toEqual({
      discriminator: 'subintent',
      version: 1,
      manifestVersion: 2,
      subintentManifest: '...',
      expiration: {
        discriminator: 'expireAtTime',
        unixTimestampSeconds: 1970,
      },
      header: {
        networkId: 2,
        startEpochInclusive: 50,
        endEpochExclusive: 150,
        intentDiscriminator: 99,
      },
    })
  })
})
