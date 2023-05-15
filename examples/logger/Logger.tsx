import * as React from 'react'
import Box from '@mui/joy/Box'
import { useLogs, clearLogsSubject } from './state'
import { Code } from '../components/Code'
import Button from '@mui/joy/Button'
import Sheet from '@mui/joy/Sheet'
import Divider from '@mui/joy/Divider'
import Typography from '@mui/joy/Typography'
import { useRdtState } from '../rdt/hooks/useRdtState'

export const Logger = () => {
  const logs = useLogs()
  const state = useRdtState()
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 2,
      }}
    >
      <Sheet
        variant="outlined"
        sx={{
          borderRadius: 'sm',
          p: 2,
          mt: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ alignSelf: 'center' }} level="h6">
            RDT Logs
          </Typography>
          <Button
            variant="outlined"
            color="info"
            onClick={() => {
              clearLogsSubject.next()
            }}
          >
            Clear
          </Button>
        </Box>

        <Divider sx={{ mb: 2, mt: 2 }} />
        <Box
          sx={{
            mt: 2,
            p: 1,
            background: 'rgb(35, 36, 31)',
            height: '500px',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          <Code>{`${logs.reverse().join('\n')}`}</Code>
        </Box>
      </Sheet>
      <Sheet
        variant="outlined"
        sx={{
          borderRadius: 'sm',
          p: 2,
          mt: 2,
        }}
      >
        <Typography sx={{ alignSelf: 'center' }} level="h6">
          RDT State
        </Typography>
        <Divider sx={{ mb: 2, mt: 2 }} />
        <Box
          sx={{
            mt: 2,
            p: 1,
            background: 'rgb(35, 36, 31)',
            height: '500px',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          <Code>{JSON.stringify(state, null, 2)}</Code>
        </Box>
      </Sheet>
    </Box>
  )
}
