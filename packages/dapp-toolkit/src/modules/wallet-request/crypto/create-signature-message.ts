import { Buffer } from 'buffer'
import type { Result } from 'neverthrow'
import { blake2b } from './blake2b'
import { Logger } from '../../../helpers'

export const createSignatureMessage = ({
  interactionId,
  dAppDefinitionAddress,
  origin,
  logger,
}: {
  logger?: Logger
  interactionId: string
  dAppDefinitionAddress: string
  origin: string
}): Result<string, { reason: string; jsError: Error }> => {
  const prefix = 'C'
  const prefixBuffer = Buffer.from('C', 'ascii')
  const lengthOfDappDefAddress = dAppDefinitionAddress.length
  const lengthOfDappDefAddressBuffer = Buffer.from(
    lengthOfDappDefAddress.toString(16),
    'hex',
  )
  const dappDefAddressBuffer = Buffer.from(dAppDefinitionAddress, 'utf-8')
  const originBuffer = Buffer.from(origin, 'utf-8')
  const interactionIdBuffer = Buffer.from(interactionId, 'utf-8')

  const messageBuffer = Buffer.concat([
    prefixBuffer,
    interactionIdBuffer,
    lengthOfDappDefAddressBuffer,
    dappDefAddressBuffer,
    originBuffer,
  ])

  const blake2bHash = blake2b(messageBuffer)
    .map((hash) => {
      logger?.debug({
        method: 'createSignatureMessage',
        messagePartsRaw: [
          prefix,
          lengthOfDappDefAddress,
          dAppDefinitionAddress,
          origin,
          interactionId,
        ],
        messageParts: [
          prefixBuffer.toString('hex'),
          lengthOfDappDefAddressBuffer.toString('hex'),
          dappDefAddressBuffer.toString('hex'),
          originBuffer.toString('hex'),
          interactionIdBuffer.toString('hex'),
        ],
        message: messageBuffer.toString('hex'),
        blake2bHash: hash.toString('hex'),
      })
      return Buffer.from(hash).toString('hex')
    })
    .mapErr((jsError) => ({ reason: 'couldNotHashMessage', jsError }))

  return blake2bHash
}
