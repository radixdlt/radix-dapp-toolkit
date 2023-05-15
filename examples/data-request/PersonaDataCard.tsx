import * as React from 'react'
import Box from '@mui/joy/Box'
import Checkbox from '@mui/joy/Checkbox'
import { personaDataState, usePersonaDataState } from './state'
import { Card } from '../components/Card'
import { personaDataField } from '@radixdlt/wallet-sdk'

export const PersonaDataCard = () => {
  const { enabled, fields, reset, oneTime } = usePersonaDataState()
  return (
    <Card
      title="Persona Data"
      side={
        <Checkbox
          checked={enabled}
          onChange={(ev) => {
            personaDataState.next({
              ...personaDataState.value,
              enabled: ev.target.checked,
            })
          }}
        />
      }
    >
      <Box sx={{ p: 2 }}>
        {Object.values(personaDataField).map((field) => (
          <Box key={field}>
            <Checkbox
              label={field}
              size="sm"
              disabled={!enabled}
              checked={fields.includes(field)}
              onChange={(ev) => {
                personaDataState.next({
                  ...personaDataState.value,
                  fields: ev.target.checked
                    ? [...personaDataState.value.fields, field]
                    : personaDataState.value.fields.filter((f) => f !== field),
                })
              }}
            />
          </Box>
        ))}

        <Box sx={{ mt: 4 }}>
          <Checkbox
            disabled={!enabled}
            label="One time request"
            size="sm"
            checked={oneTime}
            onChange={(ev) => {
              personaDataState.next({
                ...personaDataState.value,
                oneTime: ev.target.checked,
              })
            }}
          />
        </Box>

        <Box>
          <Checkbox
            disabled={!enabled}
            label="Reset"
            size="sm"
            checked={reset}
            onChange={(ev) => {
              personaDataState.next({
                ...personaDataState.value,
                reset: ev.target.checked,
              })
            }}
          />
        </Box>
      </Box>
    </Card>
  )
}
