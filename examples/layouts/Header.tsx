// @ts-ignore
import radixLogo from '../assets/radix-icon_128x128.png'
import * as React from 'react'
import '@radixdlt/dapps-dropdown'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import IconButton from '@mui/joy/IconButton'
import Layout from '../components/Layout'
import MenuIcon from '@mui/icons-material/Menu'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'
import { setNetworkId, useNetworkId } from '../network/state'
import { RadixNetworkConfig } from '@radixdlt/babylon-gateway-api-sdk'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'radix-connect-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'radix-dapps-dropdown': React.DetailedHTMLProps<
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

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Select
          value={networkId}
          onChange={(_, value) => {
            setNetworkId(value as number)
          }}
        >
          {Object.values(RadixNetworkConfig).map(
            ({ networkId, networkName }) => (
              <Option key={networkName} value={networkId}>
                {networkName} ({networkId})
              </Option>
            )
          )}
        </Select>

        <radix-connect-button></radix-connect-button>
        <radix-dapps-dropdown></radix-dapps-dropdown>
      </Box>
    </Layout.Header>
  )
}
