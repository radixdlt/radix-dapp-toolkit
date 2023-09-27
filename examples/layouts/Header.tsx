// @ts-ignore
import radixLogo from '../assets/logo.svg'
import * as React from 'react'
import '@radixdlt/dapps-dropdown'
import Box from '@mui/joy/Box'
import IconButton from '@mui/joy/IconButton'
import Layout from '../components/Layout'
import MenuIcon from '@mui/icons-material/Menu'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'
import { setNetworkId, useNetworkId } from '../network/state'
import { RadixNetworkConfig } from '@radixdlt/babylon-gateway-api-sdk'
import { IS_PUBLIC } from '../config'

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
        <a href="/" style={{ display: 'flex' }}>
          <img
            src={radixLogo}
            className="logo"
            style={{ maxHeight: '25px' }}
            alt="Radix logo"
          />
        </a>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <radix-dapps-dropdown></radix-dapps-dropdown>
        <Select
          value={networkId}
          onChange={(_, value) => {
            setNetworkId(value as number)
          }}
        >
          {IS_PUBLIC ? (
            <>
              <Option key="Mainnet" value={1}>
                Mainnet ({1})
              </Option>
              <Option key="Stokenet" value={2}>
                Stokenet ({2})
              </Option>
            </>
          ) : (
            Object.values(RadixNetworkConfig).map(
              ({ networkId, networkName }) => (
                <Option key={networkName} value={networkId}>
                  {networkName} ({networkId})
                </Option>
              )
            )
          )}
        </Select>

        <radix-connect-button></radix-connect-button>
      </Box>
    </Layout.Header>
  )
}
