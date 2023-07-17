import * as React from 'react'
import Box from '@mui/joy/Box'
import Checkbox from '@mui/joy/Checkbox'
import { useDataRequestState } from './state'
import { Card } from '../components/Card'
import { dataRequestStateClient, rdt } from '../rdt/rdt'
import { persona } from '../../src/data-request/builders/persona'

export const PersonaCard = () => {
  const dataRequestState = useDataRequestState()
  return (
    <Card title="Persona">
      <Box>
        <Checkbox
          label="With proof"
          size="sm"
          checked={!!dataRequestState.persona?.withProof}
          onChange={(ev) => {
            if (!ev.target.checked)
              dataRequestStateClient.removeState('persona')
            else
              dataRequestStateClient.patchState(
                persona().withProof(ev.target.checked)
              )
          }}
        />
      </Box>
    </Card>
  )
}
