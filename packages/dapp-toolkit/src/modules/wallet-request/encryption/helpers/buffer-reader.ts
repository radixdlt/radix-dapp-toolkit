import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { Buffer } from 'buffer'

type BufferReader = {
  finishedParsing: () => Result<boolean, Error>
  readNextBuffer: (byteCount: number) => Result<Buffer, Error>
  remainingBytes: () => Result<Buffer, Error>
}

const createBufferReader = (buffer: Buffer): BufferReader => {
  let offset = 0
  let bytesLeftToRead = buffer.length

  const readNextBuffer = (byteCount: number): Result<Buffer, Error> => {
    if (byteCount < 0) return err(Error(`'byteCount' must not be negative`))
    if (byteCount === 0) {
      return ok(Buffer.alloc(0))
    }
    if (offset + byteCount > buffer.length)
      return err(Error(`Out of buffer's boundary`))

    const bufToReturn = Buffer.alloc(byteCount)
    buffer.copy(bufToReturn, 0, offset, offset + byteCount)

    if (bufToReturn.length !== byteCount) {
      return err(Error(`Incorrect length of newly read buffer...`))
    }

    offset += byteCount
    bytesLeftToRead -= byteCount

    return ok(bufToReturn)
  }

  const finishedParsing = (): Result<boolean, Error> => {
    if (bytesLeftToRead < 0) {
      return err(Error(`Incorrect implementation, read too many bytes.`))
    }
    return ok(bytesLeftToRead === 0)
  }

  return {
    readNextBuffer,
    finishedParsing,
    remainingBytes: () =>
      finishedParsing().andThen((finished) => {
        if (finished) return ok(Buffer.alloc(0))

        const leftBuf = Buffer.alloc(bytesLeftToRead)
        buffer.copy(leftBuf, 0, offset)
        return ok(leftBuf)
      }),
  }
}

export const readBuffer = (
  buffer: Buffer,
): ((byteCount: number) => Result<Buffer, Error>) =>
  createBufferReader(buffer).readNextBuffer
