import { Box, Button, Input } from '@mui/joy'
import * as React from 'react'
import { Card } from '../components/Card'
import { createChallenge } from '../helpers/create-challenge'
import { useRdt } from '../rdt/hooks/useRdt'
import { useLogger } from '../components/Logger'
import { Code } from '../components/Code'

import { useDAppDefinitionAddress } from '../rdt/rdt'
import { RolaFactory } from './rola'
import { useNetworkId } from '../network/state'
import { GatewayService } from './gateway'

export const RolaPage = () => {
  const dAppDefinitionAddress = useDAppDefinitionAddress()
  const origin = window.location.origin
  const defaults = {
    challenge: createChallenge(),
    loading: false,
    verified: false,
  }
  const [{ challenge, loading, verified, signedChallenge }, setState] =
    React.useState<any>(defaults)
  const rdt = useRdt()
  const networkId = useNetworkId()
  const { Logger, addLog } = useLogger()
  const rola = RolaFactory({
    gatewayService: GatewayService(),
    expectedOrigin: origin,
    dAppDefinitionAddress,
    networkId,
  })

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
              .andThen((response) => {
                addLog('Got challenge response')
                const signedChallenge = response.signedChallenges[0]

                setState((prev) => ({
                  ...prev,
                  challenge,
                  signedChallenge,
                  loading: false,
                }))

                return rola(signedChallenge)
              })
              .map(() => {
                setState((prev) => ({
                  ...prev,
                  verified: true,
                }))
              })
              .mapErr(() => {
                setState((prev) => ({
                  ...prev,
                  loading: false,
                  verified: false,
                }))
              })
          }}
        >
          Send login request
        </Button>
        <Box sx={{ mt: 2 }}>
          <Code>
            {JSON.stringify(
              {
                challenge,
                signedChallenge,
                dAppDefinitionAddress,
                origin,
                verified,
              },
              null,
              2
            )}
          </Code>
        </Box>
        {Logger}
      </Card>
    </Box>
  )
}
