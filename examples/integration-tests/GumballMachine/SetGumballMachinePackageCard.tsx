import * as React from 'react'
import { Card } from '../../components/Card'
import { setGumballMachineState, useGumballMachineState } from '../state'
import { Button, FormControl, FormLabel, Input } from '@mui/joy'

export const SetGumballMachinePackageCard = () => {
  const [address, setAddress] = React.useState('')
  const { gumballMachinePackageAddress } = useGumballMachineState()
  return gumballMachinePackageAddress ? null : (
    <Card title="Set Gumball Machine Package">
      <FormControl>
        <FormLabel>Gumball Machine Package Address</FormLabel>
        <Input
          size="sm"
          placeholder="e.g. package_tdx_e_1pkdkzp9qs7pe9nd....."
          onChange={(e) => {
            setAddress(e.target.value)
          }}
        />
      </FormControl>
      <Button
        sx={{ mt: 1 }}
        disabled={!address}
        onClick={() => {
          setGumballMachineState({
            gumballMachinePackageAddress: address,
            components: {},
          })
        }}
      >
        Set Package Address
      </Button>
    </Card>
  )
}
