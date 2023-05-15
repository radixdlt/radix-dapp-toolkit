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
import { ok, Result, err } from 'neverthrow'
import { blake2b } from './blake2b'

export const createSignatureMessage = (
  challenge: Buffer,
  dAppDefinitionAddress: string,
  origin: string
): Result<Buffer, Error> => {
  try {
    const lengthOfDappDefAddress = dAppDefinitionAddress.length
    const lengthOfDappDefAddressBuffer = Buffer.from(
      lengthOfDappDefAddress.toString(16),
      'hex'
    )
    const dappDefAddressBuffer = Buffer.from(dAppDefinitionAddress, 'utf-8')
    const originBuffer = Buffer.from(origin, 'utf8')

    const messageBuffer = Buffer.concat([
      challenge,
      lengthOfDappDefAddressBuffer,
      dappDefAddressBuffer,
      originBuffer,
    ])

    return blake2b(messageBuffer)
  } catch (error) {
    return err(error as Error)
  }
}
