import * as React from 'react'
import Box from '@mui/joy/Box'
import { Card } from '../components/Card'
import Button from '@mui/joy/Button'
import Input from '@mui/joy/Input'
import { setDAppDefinitionAddress, useDAppDefinitionAddress } from '../rdt/rdt'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'
import { FormControl, FormLabel } from '@mui/joy'
import { patchConnectButtonConfig, useConnectButtonConfig } from '../rdt/state'
export const SettingsPage = () => {
  const connectButtonConfig = useConnectButtonConfig()
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
      <Card title="Connect Button">
        <FormControl>
          <FormLabel>Theme</FormLabel>
          <Select
            value={connectButtonConfig.theme}
            onChange={(_, theme: any) => patchConnectButtonConfig({ theme })}
          >
            <Option value="radix-blue">Radix Blue</Option>
            <Option value="black">Black</Option>
            <Option value="white">White</Option>
            <Option value="white-with-outline">White with outline</Option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Mode</FormLabel>
          <Select
            value={connectButtonConfig.mode}
            onChange={(_, mode: any) => patchConnectButtonConfig({ mode })}
          >
            <Option value="light">Light</Option>
            <Option value="dark">Dark</Option>
          </Select>
        </FormControl>
      </Card>
    </Box>
  )
}
