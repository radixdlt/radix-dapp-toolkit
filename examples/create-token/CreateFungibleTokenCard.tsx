import * as React from 'react'
import Input from '@mui/joy/Input'
import FormControl from '@mui/joy/FormControl'
import FormLabel from '@mui/joy/FormLabel'
import Button from '@mui/joy/Button'
import { createToken } from '../manifests/tokens'
import { useRdt } from '../rdt/hooks/useRdt'
import { useLogger } from '../components/Logger'
import { Card } from '../components/Card'
import { SelectAccount } from '../account/SelectAccount'
import { Alert, Stack } from '@mui/joy'

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
    account: string
  }>({
    account: '',
    fungible: fungibleDefaultValues,
  })
  return (
    <Card title="Create Fungible token">
      <Stack spacing={2}>
        {state.fungible.iconUrl.includes(' ') ? (
          <Alert color="warning" variant="soft">
            URL with empty spaces may not work correctly in the Radix Wallet
          </Alert>
        ) : null}

        <SelectAccount
          label="Token Owner Account"
          onChange={(account) => setState({ ...state, account })}
        ></SelectAccount>
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
        <Button
          fullWidth
          disabled={!state.fungible.initialSupply || !state.account}
          onClick={async () => {
            const values = state.fungible
            const transactionManifest = createToken(state.account).fungible({
              name: values.name,
              description: values.description,
              symbol: values.symbol,
              iconUrl: values.iconUrl,
              initialSupply: values.initialSupply,
            })
            addLog(transactionManifest)
            await rdt.walletApi
              .sendTransaction({
                transactionManifest,
                version: 1,
              })
              .mapErr((error) => addLog(JSON.stringify(error, null, 2)))
          }}
        >
          Create
        </Button>
      </Stack>

      {Logger}
    </Card>
  )
}
