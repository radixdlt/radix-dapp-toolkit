import * as React from 'react'
import Box from '@mui/joy/Box'
import Checkbox from '@mui/joy/Checkbox'
import { useDataRequestState } from './state'
import { Card } from '../components/Card'
import { dataRequestStateClient, rdt } from '../rdt/rdt'
import { personaData } from '../../src/data-request/builders/persona-data'

export const PersonaDataCard = () => {
  const dataRequestState = useDataRequestState()
  const enabled = !!dataRequestState.personaData
  return (
    <Card
      title="Persona data"
      side={
        <Checkbox
          checked={enabled}
          onChange={(ev) => {
            if (!ev.target.checked)
              dataRequestStateClient.removeState('personaData')
            else dataRequestStateClient.patchState(personaData())
          }}
        />
      }
    >
      <Box sx={{ p: 2 }}>
        {Object.values(['fullName', 'emailAddresses', 'phoneNumbers']).map(
          (field) => {
            let isChecked = false

            if (field === 'fullName') {
              isChecked = !!dataRequestState?.personaData?.fullName
            }

            if (field === 'emailAddresses') {
              isChecked =
                (dataRequestState?.personaData?.emailAddresses?.quantity || 0) >
                0
            }

            if (field === 'phoneNumbers') {
              isChecked =
                (dataRequestState?.personaData?.phoneNumbers?.quantity || 0) > 0
            }

            return (
              <Box key={field}>
                <Checkbox
                  label={field}
                  size="sm"
                  disabled={!enabled}
                  checked={isChecked}
                  onChange={(ev) => {
                    const updated = personaData({
                      ...dataRequestState.personaData!,
                    })

                    if (field === 'fullName') {
                      updated.fullName(ev.target.checked)
                    }

                    if (field === 'emailAddresses') {
                      updated.emailAddresses(ev.target.checked)
                    }

                    if (field === 'phoneNumbers') {
                      updated.phoneNumbers(ev.target.checked)
                    }

                    dataRequestStateClient.patchState(updated)
                  }}
                />
              </Box>
            )
          }
        )}

        <Box mt={2}>
          <Checkbox
            disabled={!enabled}
            label="Reset"
            size="sm"
            checked={!!dataRequestState.personaData?.reset}
            onChange={(ev) => {
              dataRequestStateClient.patchState(
                personaData({
                  ...dataRequestState.personaData!,
                  reset: ev.target.checked,
                })
              )
            }}
          />
        </Box>
      </Box>
    </Card>
  )
}
