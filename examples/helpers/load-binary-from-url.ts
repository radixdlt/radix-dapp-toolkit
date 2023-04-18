import { Buffer } from 'buffer'
import { ResultAsync } from 'neverthrow'

export const loadBinaryFromUrl = (url: string) =>
  ResultAsync.fromPromise(
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((buffer) => Buffer.from(buffer))
      .then((buffer) => buffer.toString('hex')),
    (error) => error as Error
  )
