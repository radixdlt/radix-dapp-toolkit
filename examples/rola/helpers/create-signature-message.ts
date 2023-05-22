// {
//   "challenge": "NzQ0NjI1YzctYjNjNS00MzJiLTkzNmMtODQxYTY1ODRiYTQ1",
//   "dAppDefinitionAddress": "account_rdx123abcsdasdsadasda",
//   "origin": "https://www.instabridge.com"
// }
// SPECIFICALLY THE FOLLOWING CONCATENATED RAW BYTES:
// * 32 raw bytes of the challenge
// * 1 byte - the length of the UTF-8-encoded bech32-encoded dapp-definition address
// * The bytes of the UTF-8-encoded bech32-encoded address
// * The bytes of the origin UTF-8 encoded

import { Buffer } from 'buffer'
import type { Result } from 'neverthrow'
import { blake2b } from '../crypto/blake2b'

export const createSignatureMessage = ({
  challenge,
  dAppDefinitionAddress,
  origin,
}: {
  challenge: string
  dAppDefinitionAddress: string
  origin: string
}): Result<string, { reason: string; jsError: Error }> => {
  const lengthOfDappDefAddress = dAppDefinitionAddress.length
  const lengthOfDappDefAddressBuffer = Buffer.from(
    lengthOfDappDefAddress.toString(16),
    'hex'
  )
  const dappDefAddressBuffer = Buffer.from(dAppDefinitionAddress, 'utf-8')
  const originBuffer = Buffer.from(origin, 'utf8')
  const challengeBuffer = Buffer.from(challenge, 'hex')

  const messageBuffer = Buffer.concat([
    challengeBuffer,
    lengthOfDappDefAddressBuffer,
    dappDefAddressBuffer,
    originBuffer,
  ])

  return blake2b(messageBuffer)
    .map((hash) => Buffer.from(hash).toString('hex'))
    .mapErr((jsError) => ({ reason: 'couldNotHashMessage', jsError }))
}
