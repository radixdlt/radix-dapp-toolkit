import { Box, Typography } from '@mui/joy'
import React from 'react'
import { shortenAddress } from '../../helpers/shorten-address'

import { Clipboard } from '../../components/Clipboard'
export const GumballMachineInfoBox = ({
  label,
  address,
}: {
  label: string
  address: string
}) => {
  return (
    <Box>
      <Typography level="h6">
        {label}
        <Clipboard textToCopy={address}></Clipboard>
      </Typography>
      <Typography>{shortenAddress(address)}</Typography>
    </Box>
  )
}
