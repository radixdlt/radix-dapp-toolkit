/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageModule, StorageModule } from './local-storage.module'
import { ResultAsync } from 'neverthrow'

describe('LocalStorageModule', () => {
  let storageModule: StorageModule

  beforeEach(() => {
    storageModule = LocalStorageModule(`rdt:${crypto.randomUUID()}:1`)
  })

  it('should store and read data', async () => {
    await storageModule.setState({ key: 'value' })
    const data = await storageModule.getState()
    expect(data.isOk() && data.value).toEqual({ key: 'value' })
  })

  describe('getItemById', () => {
    it('should get specific item', async () => {
      await storageModule.setState({ specific: 'value', key: 'value' })
      const data = await storageModule.getItemById('specific')
      expect(data.isOk() && data.value).toEqual('value')
    })
  })

  describe('setItems', () => {
    it('should set multiple items separately', async () => {
      await storageModule.setItems({
        specific: 'value',
      })

      await storageModule.setItems({ key: 'value' })
      const data = await storageModule.getItems()
      expect(data.isOk() && data.value).toEqual({
        specific: 'value',
        key: 'value',
      })
    })

    // TODO: This currently fails. Uncomment this test when working on RDT-225 and ensure it's passing
    it.skip('should set multiple items at once', async () => {
      await ResultAsync.combine([
        storageModule.setItems({
          specific: 'value',
        }),
        storageModule.setItems({ key: 'value' }),
      ])

      const data = await storageModule.getItems()
      expect(data.isOk() && data.value).toEqual({
        specific: 'value',
        key: 'value',
      })
    })
  })

  describe('removeItemById', () => {
    it('should remove specific item', async () => {
      await storageModule.setState({ specific: 'value', key: 'value' })
      await storageModule.removeItemById('specific')
      const data = await storageModule.getState()
      expect(data.isOk() && data.value).toEqual({ key: 'value' })
    })
  })
})
