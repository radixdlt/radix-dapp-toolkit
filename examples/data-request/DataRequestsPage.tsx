import * as React from 'react'
import Box from '@mui/joy/Box'
import Divider from '@mui/joy/Divider'
import Sheet from '@mui/joy/Sheet'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'
import { AccountsCard } from './AccountsCard'
import { PersonaDataCard } from './PersonaDataCard'
import { getRequestDataPayload, useDataRequestPayload } from './state'
import { useRequestData } from '../rdt/hooks/useRequestData'
import { logSubject } from '../logger/state'
import { Code } from '../components/Code'
import { getNetworkId } from '../helpers/get-network-id'
import { Buffer } from 'buffer'
import { LoginCard } from './LoginCard'

export const DataRequestsPage = () => {
  const dataRequestPayload = useDataRequestPayload()
  const sendDataRequest = useRequestData()

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(160px, 300px) minmax(200px, 1fr)',
        gap: 1,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gap: 1,
        }}
      >
        <LoginCard />
        <AccountsCard />
        <PersonaDataCard />
      </Box>
      <Box>
        <Sheet
          variant="outlined"
          sx={{
            borderRadius: 'sm',
            p: 2,
            mb: 2,
            height: '100%',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ alignSelf: 'center' }} level="h6">
                Data Request Payload
              </Typography>
              <Button
                onClick={async () => {
                  logSubject.next(
                    `send data request ${JSON.stringify(
                      dataRequestPayload,
                      null,
                      2
                    )}`
                  )
                  sendDataRequest(dataRequestPayload)
                }}
                sx={{ alignSelf: 'center', width: '150px' }}
              >
                Send request
              </Button>
            </Box>

            <Divider sx={{ mb: 2, mt: 2 }} />

            <Code>{JSON.stringify(dataRequestPayload, null, 2)}</Code>
          </Box>
        </Sheet>
      </Box>
    </Box>
  )
}
