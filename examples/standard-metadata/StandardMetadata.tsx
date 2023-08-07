import * as React from 'react'
import {
  FormControl,
  FormLabel,
  Select,
  Stack,
  Option,
  Button,
  Input,
  Divider,
  Chip,
  Link,
} from '@mui/joy'
import { useState } from 'react'
import {
  createMetadataManifest,
  StandardMetadata as StandardMetadataType,
} from './manifests'
import { rdt } from '../rdt/rdt'
import { set } from 'zod'
const definition = {
  fungible: {
    visual: ['name', 'symbol', 'description', 'tags', 'icon_url', 'info_url'],
    verification: ['dapp_definitions'],
  },
  nonFungible: {
    visual: ['name', 'description', 'tags', 'icon_url', 'info_url'],
    verification: ['dapp_definitions'],
  },
  account: {
    visual: ['name', 'description', 'tags', 'icon_url'],
    verification: [
      'account_type',
      'claimed_entities',
      'claimed_websites',
      'dapp_definitions',
    ],
  },
  component: {
    visual: ['name', 'description', 'tags'],
    verification: ['dapp_definition'],
  },
}

export const StandardMetadata = (props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [state, setState] = useState<
    {
      type: 'fungible' | 'nonFungible' | 'account'
    } & StandardMetadataType
  >({
    type: props.type || 'fungible',
    address: props.address || '',
    name: 'Name',
    symbol: 'SYMBOL',
    description: 'Description',
    tags: 'some, radical, radix, tags, here',
    icon_url: 'https://assets.radixdlt.com/icons/icon-xrd-32x32.png',
    info_url: 'https://www.radixdlt.com/',
  })

  const renderField = (key: string) => {
    return (
      <FormControl key={key}>
        <FormLabel>{key}</FormLabel>
        <Input
          value={state[key]}
          onChange={(ev) => {
            setState({ ...state, [key]: ev.target.value })
          }}
        />
      </FormControl>
    )
  }
  const sendTx = () => {
    setIsLoading(true)
    const transactionManifest = createMetadataManifest(state)
    rdt.walletApi
      .sendTransaction({
        transactionManifest,
        version: 1,
      })
      .map(() => setIsLoading(false))
      .mapErr(() => setIsLoading(false))
    console.log(transactionManifest)
  }

  return (
    <Stack spacing={2}>
      {props.type ? null : (
        <FormControl>
          <FormLabel>Entity Type</FormLabel>
          <Select
            value={state.type}
            onChange={(_, value) => {
              setState({ ...state, type: value as any })
            }}
          >
            <Option value="fungible">Fungible</Option>
            <Option value="account">Account</Option>
            <Option value="nonFungible">Non Fungible Manager</Option>
            <Option value="component">Component / Blueprint</Option>
          </Select>
        </FormControl>
      )}
      {props.address ? null : (
        <FormControl>
          <FormLabel>Entity Address</FormLabel>
          <Input
            value={state.address}
            onChange={(ev) => {
              setState({ ...state, address: ev.target.value })
            }}
          />
        </FormControl>
      )}
      <Divider sx={{ paddingTop: '10px' }}>
        <Chip variant="soft" color="neutral" size="sm">
          <Link href="https://docs-babylon.radixdlt.com/main/standards/metadata-for-wallet-display.html">
            Visual Standard
          </Link>
        </Chip>
      </Divider>
      {(definition[state.type]?.visual || []).map((key) => renderField(key))}
      <Button disabled={isLoading} onClick={sendTx}>
        Send TX to wallet
      </Button>
    </Stack>
  )
}
