import { Box, Button, Input } from '@mui/joy'
import * as React from 'react'
import { Card } from '../components/Card'
import { createChallenge } from '../helpers/create-challenge'
import { useRdt } from '../rdt/hooks/useRdt'
import { useLogger } from '../components/Logger'
import { Code } from '../components/Code'
import { createSignatureMessage } from './helpers/create-signature-message'

import { useDAppDefinitionAddress } from '../rdt/rdt'
import { Rola } from './helpers/rola'
import { useNetworkId } from '../network/state'
import { useEntities } from '../entity/state'
import { useRdtState } from '../rdt/hooks/useRdtState'
import { PersonaProof } from '../../src/io/transformations/wallet-to-rdt'

export const RolaPage = () => {
  const dAppDefinitionAddress = useDAppDefinitionAddress()
  const origin = window.location.origin
  const defaults = {
    challenge: createChallenge(),
    loading: false,
    signature: '',
    publicKey: '',
    curve: '',
    verified: false,
  }
  const [
    { challenge, loading, signature, publicKey, curve, verified },
    setState,
  ] = React.useState(defaults)
  const rdt = useRdt()
  const rdtState = useRdtState()
  const networkId = useNetworkId()
  const { Logger, addLog } = useLogger()
  const entities = useEntities()
  // const metadataPublicKeys =
  //   entities[rdtState?.persona?.identityAddress!]?.metadata[0]?.value
  //     .as_string_collection ?? []
  // const identityAddress = rdtState?.persona?.identityAddress
  return (
    <Box>
      <Card title="ROLA (Radix Off-Ledger Authentication)">
        <Box sx={{ mb: 2 }}>
          <Input value={challenge} sx={{ mb: 1 }} readOnly disabled />
          <Button
            onClick={() => {
              setState(() => ({
                ...defaults,
                challenge: createChallenge(),
              }))
            }}
            disabled={loading}
          >
            Generate challenge
          </Button>
        </Box>
        <Button
          disabled={loading}
          onClick={() => {
            setState((prev) => ({ ...defaults, loading: true }))
            addLog('Sending login request with challenge...')
            rdt
              .requestData({ challenge })
              .map((response) => {
                const { proof, challenge, identityAddress } =
                  response.signedChallenges.find(
                    (item): item is PersonaProof => item.type === 'persona'
                  )!
                const { curve, publicKey, signature } = proof

                addLog('Got challenge response')

                setState((prev) => ({
                  ...prev,
                  challenge,
                  curve,
                  publicKey,
                  signature,
                  loading: false,
                }))

                return Rola({
                  curve,
                  publicKeyHex: publicKey,
                  networkId,
                  addressType: 'identity',
                  address: identityAddress,
                  origin,
                  dAppDefinitionAddress,
                  challenge,
                  signature,
                  metadataPublicKeys: [],
                })
              })
              // .map((verified) => {
              //   setState((prev) => ({
              //     ...prev,
              //     verified,
              //   }))
              // })
              .mapErr(() => {
                setState((prev) => ({ ...prev, loading: false }))
              })
          }}
        >
          Send login request
        </Button>
        {/* <Box sx={{ mt: 2 }}>
          <Code>
            {JSON.stringify(
              {
                challenge,
                signature,
                publicKey,
                dAppDefinitionAddress,
                origin,
                curve,
                verified,
                identityAddress,
                metadataPublicKeys,
              },
              null,
              2
            )}
          </Code>
        </Box> */}
        {Logger}
      </Card>
    </Box>
  )
}
