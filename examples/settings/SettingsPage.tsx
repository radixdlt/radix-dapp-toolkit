import * as React from 'react'
import Box from '@mui/joy/Box'
import { Card } from '../components/Card'
import Button from '@mui/joy/Button'
import Input from '@mui/joy/Input'
import { setDAppDefinitionAddress, useDAppDefinitionAddress } from '../rdt/rdt'

export const SettingsPage = () => {
  const dAppDefinitionAddress = useDAppDefinitionAddress()
  const [state, setState] = React.useState<{ dAppDefinitionAddress: string }>({
    dAppDefinitionAddress,
  })

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'minmax(300px, 1fr)',
          md: 'repeat(2, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      <Card title="Set dApp Definition Address">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setDAppDefinitionAddress(state.dAppDefinitionAddress)
          }}
        >
          <Input
            placeholder="Enter dApp Definition Address"
            required
            defaultValue={dAppDefinitionAddress}
            sx={{ mb: 1, fontSize: 'var(--joy-fontSize-sm)' }}
            onChange={(event) => {
              setState((prev) => ({
                ...prev,
                dAppDefinitionAddress: event.target.value,
              }))
            }}
          />
          <Button type="submit">Update</Button>
        </form>
      </Card>
    </Box>
  )
}
