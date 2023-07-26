import * as React from 'react'
import Box from '@mui/joy/Box'
import Divider from '@mui/joy/Divider'
import Input from '@mui/joy/Input'
import FormControl from '@mui/joy/FormControl'
import Typography from '@mui/joy/Typography'
import FormLabel from '@mui/joy/FormLabel'
import Button from '@mui/joy/Button'
import Sheet from '@mui/joy/Sheet'
import { createToken } from '../manifests/tokens'
import { useRdt } from '../rdt/hooks/useRdt'
import { useLogger } from '../components/Logger'
import { accounts } from '../../src/data-request/builders/accounts'

type CreateTokenBase = {
  name: string
  description: string
  iconUrl: string
}

type FungibleToken = CreateTokenBase & { initialSupply: number; symbol: string }

const fungibleDefaultValues = {
  name: 'MyResource',
  description: 'A very innovative and important resource',
  symbol: 'VIP',
  iconUrl: 'https://i.imgur.com/A2itmif.jpeg',
  initialSupply: 100,
}

export const CreateFungibleTokenCard = () => {
  const { Logger, addLog, reset } = useLogger()
  const rdt = useRdt()
  const [state, setState] = React.useState<{
    fungible: FungibleToken
  }>({
    fungible: fungibleDefaultValues,
  })
  return (
    <Sheet
      variant="outlined"
      sx={{
        borderRadius: 'sm',
        p: 2,
      }}
    >
      <Typography sx={{ alignSelf: 'center' }} level="h6">
        Create Fungible token
      </Typography>
      <Divider sx={{ mb: 2, mt: 2 }} />
      <Box sx={{ mb: 4, mt: 2 }}>
        {[
          {
            label: 'Name',
            key: 'name',
            type: 'text',
          },
          {
            label: 'Description',
            key: 'description',
            type: 'text',
          },
          {
            label: 'Symbol',
            key: 'symbol',
            type: 'text',
            defaultValue: 'VIP',
          },
          {
            label: 'Icon URL',
            key: 'iconUrl',
            type: 'text',
          },
          {
            label: 'Initial supply',
            key: 'initialSupply',
            type: 'number',
          },
        ].map((item) => (
          <FormControl sx={{ mb: 1 }} key={item.key}>
            <FormLabel>{item.label}</FormLabel>
            <Input
              size="sm"
              type={item.type}
              defaultValue={state.fungible[item.key]}
              onChange={(e) => {
                setState((s) => ({
                  ...s,
                  fungible: {
                    ...s.fungible,
                    [item.key]: e.target.value,
                  },
                }))
              }}
            />
          </FormControl>
        ))}
      </Box>
      {Logger}
      <Button
        fullWidth
        disabled={Object.values(state.fungible).some((v) => !v)}
        onClick={async () => {
          const values = state.fungible
          await rdt.walletApi
            .sendOneTimeRequest(accounts().exactly(1))
            .andThen(({ accounts }) => {
              const transactionManifest = createToken(
                accounts![0].address
              ).fungible({
                name: values.name,
                description: values.description,
                symbol: values.symbol,
                iconUrl: values.iconUrl,
                initialSupply: values.initialSupply,
              })
              addLog(transactionManifest)
              return rdt.walletApi.sendTransaction({
                transactionManifest,
                version: 1,
              })
            })
        }}
      >
        Create
      </Button>
    </Sheet>
  )
}
