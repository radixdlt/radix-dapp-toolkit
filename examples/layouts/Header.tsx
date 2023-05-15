// @ts-ignore
import radixLogo from '../assets/radix-icon_128x128.png'
import * as React from 'react'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import IconButton from '@mui/joy/IconButton'
import Layout from '../components/Layout'
import MenuIcon from '@mui/icons-material/Menu'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'
import { networkIdMap } from '../../src/gateway/_types'
import { setNetworkId, useNetworkId } from '../network/state'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'radix-connect-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
    }
  }
}

export const Header = ({
  setDrawerOpen,
}: {
  setDrawerOpen: (value: boolean) => void
}) => {
  const networkId = useNetworkId()
  return (
    <Layout.Header>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <IconButton
          variant="outlined"
          size="sm"
          onClick={() => setDrawerOpen(true)}
          sx={{ display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <img
          style={{ width: 30 }}
          src={radixLogo}
          className="logo"
          alt="Radix logo"
        />
        <Typography component="h1" fontWeight="xl">
          Radix dApp Sandbox
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5 }}>
        <Select
          value={networkId}
          onChange={(_, value) => {
            setNetworkId(value as number)
          }}
        >
          {[...networkIdMap.entries()].map(([networkId]) => (
            <Option key={networkId} value={networkId}>
              {networkId}
            </Option>
          ))}
        </Select>

        <radix-connect-button></radix-connect-button>
      </Box>
    </Layout.Header>
  )
}
