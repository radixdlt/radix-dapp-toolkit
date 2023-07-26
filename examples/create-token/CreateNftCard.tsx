import * as React from 'react'
import Box from '@mui/joy/Box'
import Divider from '@mui/joy/Divider'
import RadioGroup from '@mui/joy/RadioGroup'
import Radio from '@mui/joy/Radio'
import Input from '@mui/joy/Input'
import Checkbox from '@mui/joy/Checkbox'
import FormControl from '@mui/joy/FormControl'
import Typography from '@mui/joy/Typography'
import FormLabel from '@mui/joy/FormLabel'
import Button from '@mui/joy/Button'
import Sheet from '@mui/joy/Sheet'
import { createToken } from '../manifests/tokens'
import { useRdt } from '../rdt/hooks/useRdt'
import { useLogger } from '../components/Logger'
import { CreateFungibleTokenCard } from './CreateFungibleTokenCard'
import { accounts } from '../../src/data-request/builders/accounts'

type CreateTokenBase = {
  name: string
  description: string
  iconUrl: string
}

type Nft = CreateTokenBase & { items: { id: string; value: string }[] }

const nftDefaultValues = {
  name: 'MyResource',
  description: 'A very innovative and important resource',
  iconUrl: 'https://i.imgur.com/9YQ9Z0x.png',
  items: [
    {
      id: '27df6f08-6df3-4699-b172-e885ac3fe7d4',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Filling+Station+Breakfast-large.jpg',
    },
    {
      id: '959f6fde-155c-456f-9bfd-d52f59d4562d',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Filling+Station+Breakfast-large.jpg',
    },
    {
      id: '9859ad23-ffc9-4297-90be-1aaec6e768fd',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Filling+Station+Breakfast-medium.jpg',
    },
    {
      id: 'f1691a1c-1ae9-4a5c-8e50-33b1a10c2ff7',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Filling+Station+Breakfast-small.jpg',
    },
    {
      id: '8efeb2c7-ab20-4db6-81cd-8c6d9d851ec1',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Frame 6-large.png',
    },
    {
      id: 'cc88ca59-afe5-4641-9ec6-e120db310ec7',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Frame 6-medium.png',
    },
    {
      id: '9f843b05-1df9-4da4-9ad1-13d845d78441',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Frame 6-small.png',
    },
    {
      id: 'cc3591ba-d5f5-4082-9ce7-88d0c83f62f3',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Fried Kway Teow-large.jpg',
    },
    {
      id: '339f5646-bfe3-4fb2-91bc-f2f0a201eb71',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Fried Kway Teow-medium.jpg',
    },
    {
      id: '4705f946-9e75-4458-ba18-532f6bf613d6',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Fried Kway Teow-small.jpg',
    },
    {
      id: '3e7971ac-c25f-42b7-9eb0-be645bbd83e8',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/ICON-transparency.png',
    },
    {
      id: '31ba8b9f-1c08-4e69-b6f4-484952039764',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/KL Haze-large.jpg',
    },
    {
      id: '6a1973d2-178c-47da-8a80-b620c6b640b4',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/KL Haze-medium.jpg',
    },
    {
      id: 'ad0bd4b9-e876-4c61-bdc3-08b8653bff40',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/KL Haze-small.jpg',
    },
    {
      id: '61cc9bd0-1031-4fec-9ba0-f797e5457464',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/modern_kunst_museum_pano-2.jpg',
    },
    {
      id: '2a392126-4b2f-4491-8c25-60314a0cbfff',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/modern_kunst_museum_pano-3.jpg',
    },
    {
      id: '3e0d49cf-80ca-4d1d-b75d-fcbdd58bbbf1',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/modern_kunst_museum_pano.jpg',
    },
    {
      id: '0c4a66e9-1240-405e-b1ab-87c01a0b96d5',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/scryptonaut_patch.svg',
    },
  ],
}

export const CreateNftCard = () => {
  const { Logger, addLog, reset } = useLogger()
  const rdt = useRdt()
  const [state, setState] = React.useState<{
    nft: Nft
  }>({
    nft: nftDefaultValues,
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
        Create NFT
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
            label: 'Icon URL',
            key: 'iconUrl',
            type: 'text',
          },
        ].map((item) => (
          <FormControl sx={{ mb: 1 }} key={item.key}>
            <FormLabel>{item.label}</FormLabel>
            <Input
              size="sm"
              type={item.type}
              defaultValue={state.nft[item.key]}
              onChange={(e) => {
                setState((s) => ({
                  ...s,
                  nft: {
                    ...s.nft,
                    [item.key]: e.target.value,
                  },
                }))
              }}
            />
          </FormControl>
        ))}
        <Typography level="body2">NFT Collection</Typography>
        <Box sx={{ maxHeight: '150px', overflow: 'auto', padding: 1 }}>
          {state.nft.items.map((item, index) => (
            <FormControl sx={{ mb: 1 }} key={item.id}>
              <FormLabel>Image URL #{index + 1} </FormLabel>
              <Box sx={{ display: 'flex' }}>
                <Input
                  fullWidth
                  size="sm"
                  defaultValue={item.value}
                  type="url"
                  onChange={(e) => {
                    setState((s) => {
                      return {
                        ...s,
                        nft: {
                          ...s.nft,
                          items: s.nft.items.map((v) =>
                            v.id === item.id
                              ? { ...v, value: e.target.value }
                              : v
                          ),
                        },
                      }
                    })
                  }}
                />
                {Logger}
                <Button
                  size="sm"
                  variant="outlined"
                  sx={{ ml: 1 }}
                  onClick={() => {
                    setState((s) => {
                      const updated = {
                        ...s,
                        nft: {
                          ...s.nft,
                          items: s.nft.items.filter((_, i) => i !== index),
                        },
                      }
                      if (updated.nft.items.length === 0) {
                        updated.nft.items.push({
                          id: crypto.randomUUID(),
                          value: '',
                        })
                      }
                      return updated
                    })
                  }}
                >
                  X
                </Button>
              </Box>
            </FormControl>
          ))}
        </Box>
      </Box>
      <Button
        fullWidth
        sx={{ mb: 1 }}
        onClick={() => {
          setState((s) => {
            return {
              ...s,
              nft: {
                ...s.nft,
                items: [...s.nft.items, { id: crypto.randomUUID(), value: '' }],
              },
            }
          })
        }}
      >
        Add item
      </Button>
      <Button
        disabled={Object.keys(state.nft).some((key) => {
          if (key === 'items') return state.nft.items.some((i) => !i.value)
          return !state.nft[key]
        })}
        fullWidth
        onClick={async () => {
          const values = state.nft
          await rdt.walletApi
            .sendOneTimeRequest(accounts().exactly(1))
            .andThen(({ accounts }) =>
              rdt.walletApi.sendTransaction({
                transactionManifest: createToken(accounts![0].address).nft({
                  name: values.name,
                  description: values.description,
                  iconUrl: values.iconUrl,
                  items: values.items.map((item) => item.value),
                }),
                version: 1,
              })
            )
        }}
      >
        Create
      </Button>
    </Sheet>
  )
}
