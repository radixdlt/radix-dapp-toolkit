import * as React from 'react'
import Box from '@mui/joy/Box'
import { CreateFungibleTokenCard } from './CreateFungibleTokenCard'
import { CreateNftCard } from './CreateNftCard'

export const CreateTokenPage = () => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 2,
      }}
    >
      <CreateFungibleTokenCard />
      <CreateNftCard />
    </Box>
  )
}
