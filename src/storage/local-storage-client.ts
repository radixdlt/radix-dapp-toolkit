import { ok, ResultAsync } from 'neverthrow'
import { errorIdentity } from '../helpers/error-identity'
import { parseJSON } from '../helpers/parse-json'
import { StorageProvider } from '../_types'

export const LocalStorageClient = (): StorageProvider => {
  const getData = (key: string): Promise<string | undefined> =>
    new Promise((resolve, reject) => {
      try {
        const data = localStorage.getItem(key)
        return resolve(data ? data : undefined)
      } catch (error) {
        return reject(error)
      }
    })

  const setData = (key: string, data: any): Promise<void> =>
    new Promise((resolve, reject) => {
      try {
        localStorage.setItem(key, JSON.stringify(data))
        return resolve()
      } catch (error) {
        return reject(error)
      }
    })

  return {
    getData: <T = any>(key: string) =>
      ResultAsync.fromPromise(getData(key), errorIdentity).andThen((data) =>
        data ? parseJSON<T>(data) : ok(undefined)
      ),
    setData: (key: string, data: any) =>
      ResultAsync.fromPromise(setData(key, data), errorIdentity),
  }
}
