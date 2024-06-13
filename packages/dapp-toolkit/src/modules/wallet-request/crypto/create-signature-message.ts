import { Buffer } from 'buffer'
import type { Result } from 'neverthrow'
import { blake2b } from './blake2b'

export const createSignatureMessage = ({
  interactionId,
  dAppDefinitionAddress,
  origin,
}: {
  interactionId: string
  dAppDefinitionAddress: string
  origin: string
}): Result<string, { reason: string; jsError: Error }> => {
  const prefix = Buffer.from('C', 'ascii')
  const lengthOfDappDefAddress = dAppDefinitionAddress.length
  const lengthOfDappDefAddressBuffer = Buffer.from(
    lengthOfDappDefAddress.toString(16),
    'hex',
  )
  const dappDefAddressBuffer = Buffer.from(dAppDefinitionAddress, 'utf-8')
  const originBuffer = Buffer.from(origin, 'utf-8')
  const interactionIdBuffer = Buffer.from(interactionId, 'hex')

  const messageBuffer = Buffer.concat([
    prefix,
    interactionIdBuffer,
    lengthOfDappDefAddressBuffer,
    dappDefAddressBuffer,
    originBuffer,
  ])

  return blake2b(messageBuffer)
    .map((hash) => Buffer.from(hash).toString('hex'))
    .mapErr((jsError) => ({ reason: 'couldNotHashMessage', jsError }))
}
