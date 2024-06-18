import { describe, expect, it } from 'vitest'
import { createSignatureMessage } from './create-signature-message'
import { ed25519 } from '@noble/curves/ed25519'
import base64url from 'base64url'

describe('signature', () => {
  it('should verify signature', async () => {
    const { signature, request, identity, origin, dAppDefinitionAddress } = {
      request:
        'eyJpdGVtcyI6eyJkaXNjcmltaW5hdG9yIjoiYXV0aG9yaXplZFJlcXVlc3QiLCJhdXRoIjp7ImRpc2NyaW1pbmF0b3IiOiJsb2dpbldpdGhDaGFsbGVuZ2UiLCJjaGFsbGVuZ2UiOiIyODU5MjNiNmQ4YzYwYzU1OTQzMTE5NmRkOGViZTc3OWYxZTM0M2IyZDlhNmFiMTk3YjFiOTY5YzYwNWQwYzJiIn0sInJlc2V0Ijp7ImFjY291bnRzIjpmYWxzZSwicGVyc29uYURhdGEiOmZhbHNlfX0sImludGVyYWN0aW9uSWQiOiJkZTA2M2Y1Yi1iYWRjLTRhNTItYjJhNC1jNWZmYzA4NGZmZmIiLCJtZXRhZGF0YSI6eyJ2ZXJzaW9uIjoyLCJkQXBwRGVmaW5pdGlvbkFkZHJlc3MiOiJhY2NvdW50X3RkeF8yXzEyeWY5Z2Q1M3lmZXA3YTY2OWZ2MnQzd203bno5emVlendkMDRuMDJhNDMza2VyOHZ6YTZyaGUiLCJuZXR3b3JrSWQiOjIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTE3MyJ9fQ',
      signature:
        '9cbb3b3279e07b8c1e381494ec7bf302a7817e0d75ee60ba978f0f24ccef905867df84bfa6c3c7bfc3fee43f332fa7b17790ecdb045dec333fa26821dabec70e',
      identity:
        '0c1da7eaccea0ed59ab322e71cf0ceff865c46106f4e281c69842d735101ceed',
      origin: 'http://localhost:5173',
      dAppDefinitionAddress:
        'account_tdx_2_12yf9gd53yfep7a669fv2t3wm7nz9zeezwd04n02a433ker8vza6rhe',
    }

    const decoded = base64url.decode(request)
    const { interactionId } = JSON.parse(decoded)

    const privateKey =
      '0b5b870d6c258d1003102d896c4a4736e1f69e77ad61af833362800b97218b3e'

    const message = createSignatureMessage({
      interactionId,
      dAppDefinitionAddress,
      origin,
    })._unsafeUnwrap()

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
