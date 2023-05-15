import * as React from 'react'
import Box from '@mui/joy/Box'
import { DeployGumballMachineCard } from './GumballMachine/DeployGumballMachineCard'
import { InstantiateGumballMachineCard } from './GumballMachine/InstantiateGumballMachineCard'
import { GumballMachineExamples } from './GumballMachine/GumballMachineExamples'
import { SetPriceCard } from './GumballMachine/SetPriceCard'

export const IntegrationTestsPage = () => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'minmax(300px, 1fr)',
          sm: 'minmax(300px, 1fr)',
          md: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(2, minmax(0, 1fr))',
          xl: 'repeat(4, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      <DeployGumballMachineCard />
      <SetPriceCard />
      {GumballMachineExamples()}
    </Box>
  )
}
