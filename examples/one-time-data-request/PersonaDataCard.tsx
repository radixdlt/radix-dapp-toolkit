import * as React from 'react'
import Box from '@mui/joy/Box'
import Checkbox from '@mui/joy/Checkbox'
import { Card } from '../components/Card'
import { dataRequestStateClient } from '../rdt/rdt'
import { personaData } from '../../src/data-request/builders/persona-data'

export const PersonaDataCard = ({
  state,
  updateState,
}: {
  state: {
    enabled: boolean
    data: {
      fullName: boolean
      emailAddresses: boolean
      phoneNumbers: boolean
    }
  }
  updateState: (state: {
    enabled: boolean
    data: {
      fullName: boolean
      emailAddresses: boolean
      phoneNumbers: boolean
    }
  }) => void
}) => {
  const enabled = !!state.enabled
  return (
    <Card
      title="Persona data"
      side={
        <Checkbox
          checked={enabled}
          onChange={(ev) => {
            updateState({ ...state, enabled: ev.target.checked })
          }}
        />
      }
    >
      <Box sx={{ p: 2 }}>
        {Object.values(['fullName', 'emailAddresses', 'phoneNumbers']).map(
          (field) => {
            let isChecked = false

            if (field === 'fullName') {
              isChecked = state.data.fullName
            }

            if (field === 'emailAddresses') {
              isChecked = state.data.emailAddresses
            }

            if (field === 'phoneNumbers') {
              isChecked = state.data.phoneNumbers
            }

            return (
              <Box key={field}>
                <Checkbox
                  label={field}
                  size="sm"
                  disabled={!enabled}
                  checked={isChecked}
                  onChange={(ev) => {
                    if (field === 'fullName') {
                      updateState({
                        ...state,
                        data: { ...state.data, fullName: ev.target.checked },
                      })
                    }

                    if (field === 'emailAddresses') {
                      updateState({
                        ...state,
                        data: {
                          ...state.data,
                          emailAddresses: ev.target.checked,
                        },
                      })
                    }

                    if (field === 'phoneNumbers') {
                      updateState({
                        ...state,
                        data: {
                          ...state.data,
                          phoneNumbers: ev.target.checked,
                        },
                      })
                    }
                  }}
                />
              </Box>
            )
          }
        )}
      </Box>
    </Card>
  )
}
