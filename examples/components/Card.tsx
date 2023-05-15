import * as React from 'react'
import Divider from '@mui/joy/Divider'
import Typography from '@mui/joy/Typography'
import Sheet from '@mui/joy/Sheet'
import Box from '@mui/joy/Box'

export const Card = ({
  children,
  title,
  side,
}: React.PropsWithChildren<{ title: string; side?: JSX.Element }>) => (
  <Sheet
    variant="outlined"
    sx={{
      borderRadius: 'sm',
      p: 2,
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography level="h6" sx={{ alignSelf: 'center' }}>
        {title}
      </Typography>
      <Box sx={{ alignSelf: 'center' }}>{side ? side : null}</Box>
    </Box>

    <Divider sx={{ mb: 2, mt: 2 }} />

    {children}
  </Sheet>
)
