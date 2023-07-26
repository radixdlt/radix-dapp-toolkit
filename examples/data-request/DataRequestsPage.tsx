import * as React from 'react'
import Box from '@mui/joy/Box'
import Divider from '@mui/joy/Divider'
import Sheet from '@mui/joy/Sheet'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'
import { AccountsCard } from './AccountsCard'
import { PersonaDataCard } from './PersonaDataCard'
import { useDataRequestState } from './state'
import { Code } from '../components/Code'
import { PersonaCard } from './PersonaCard'
import { rdt } from '../rdt/rdt'

export const DataRequestsPage = () => {
  const dataRequestState = useDataRequestState()

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
        <PersonaCard />
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
                Data Request
              </Typography>
              <Button
                onClick={() => {
                  rdt.walletApi.sendRequest()
                }}
                sx={{ alignSelf: 'center', width: '150px' }}
              >
                Send request
              </Button>
            </Box>

            <Divider sx={{ mb: 2, mt: 2 }} />

            <Code>{JSON.stringify(dataRequestState, null, 2)}</Code>
          </Box>
        </Sheet>
      </Box>
    </Box>
  )
}
