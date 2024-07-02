import { describe, expect, it } from 'vitest'
import { createSignatureMessage } from './create-signature-message'
import { ed25519 } from '@noble/curves/ed25519'
import base64url from 'base64url'

describe('signature', () => {
  it('should verify signature', async () => {
    const { signature, request, identity, origin, dAppDefinitionAddress } = {
      request:
        'eyJpdGVtcyI6eyJkaXNjcmltaW5hdG9yIjoiYXV0aG9yaXplZFJlcXVlc3QiLCJhdXRoIjp7ImRpc2NyaW1pbmF0b3IiOiJsb2dpbldpdGhDaGFsbGVuZ2UiLCJjaGFsbGVuZ2UiOiI3ODA3YzI5MDRmZDE4Njc3Mzg2MzljOGU0MDJmZTU1MzIwZGEyYzYyNzUxODllZjA1MTNkZTM2ZGRhMjBmN2VlIn0sInJlc2V0Ijp7ImFjY291bnRzIjpmYWxzZSwicGVyc29uYURhdGEiOmZhbHNlfX0sImludGVyYWN0aW9uSWQiOiJiMjVjODU4Ny1kMDhhLTQ4YmYtYmViNi1hODBhZTk4YzUxMDYiLCJtZXRhZGF0YSI6eyJ2ZXJzaW9uIjoyLCJkQXBwRGVmaW5pdGlvbkFkZHJlc3MiOiJhY2NvdW50X3RkeF8yXzEyeWY5Z2Q1M3lmZXA3YTY2OWZ2MnQzd203bno5emVlendkMDRuMDJhNDMza2VyOHZ6YTZyaGUiLCJuZXR3b3JrSWQiOjIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTE3MyJ9fQ',
      signature:
        '509dd1a493f2e04830543be490b04770f9bf36cf57dd4ed8ac52951eb850daa0110ba320a32122ee87594999a430cfde7d34a5e6009608839cd8c4a009f6dc07',
      identity:
        'faf57eae029aaf4312a11c433bd2dee645212a5b8cdaf3af3d4b423fc57472b7',
      origin: 'http://localhost:5173',
      dAppDefinitionAddress:
        'account_tdx_2_12yf9gd53yfep7a669fv2t3wm7nz9zeezwd04n02a433ker8vza6rhe',
    }

    const decoded = base64url.decode(request)
    const { interactionId } = JSON.parse(decoded)

    const privateKey =
      'a18e4e44d66f428302494fa34296efdc8db4b32488c853fbe31aab0002c128a5'

    const message = createSignatureMessage({
      interactionId,
      dAppDefinitionAddress,
      origin,
    })._unsafeUnwrap()

    const expectedMessage =
      '30be6dd4eca632a6d393f76e4ef29edead5e4a169644a2a3fabf9d8bd8a2a2fd'

    expect(message).toBe(expectedMessage)

    const expectedSignatureHex = Buffer.from(
      ed25519.sign(message, privateKey),
    ).toString('hex')

    expect(signature).toBe(expectedSignatureHex)

    const expectedPublicKey = Buffer.from(
      ed25519.getPublicKey(privateKey),
    ).toString('hex')

    expect(identity).toBe(expectedPublicKey)

    const signatureValidation = ed25519.verify(signature, message, identity)

    expect(signatureValidation).toBe(true)
  })
})
