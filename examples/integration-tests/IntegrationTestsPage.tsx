import * as React from 'react'
import Box from '@mui/joy/Box'
import { DeployGumballMachineCard } from './GumballMachine/DeployGumballMachineCard'
import { GumballMachineExamples } from './GumballMachine/GumballMachineExamples'
import { useGumballMachineState } from './state'
import { GumballMachineCard } from './GumballMachine/GumballMachineCard'

export const IntegrationTestsPage = () => {
  const { components } = useGumballMachineState()

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'minmax(300px, 1fr)',
          sm: 'minmax(300px, 1fr)',
          md: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(2, minmax(0, 1fr))',
          xl: 'repeat(3, minmax(0, 1fr))',
          xxl: 'repeat(4, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      <DeployGumballMachineCard />
      {Object.values(components).map((component) => (
        <GumballMachineCard key={component.address} {...component}></GumballMachineCard>
      ))}
      {GumballMachineExamples()}
    </Box>
  )
}
