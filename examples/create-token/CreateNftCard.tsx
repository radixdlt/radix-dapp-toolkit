import * as React from 'react'
import Box from '@mui/joy/Box'
import Input from '@mui/joy/Input'
import FormControl from '@mui/joy/FormControl'
import Typography from '@mui/joy/Typography'
import FormLabel from '@mui/joy/FormLabel'
import Button from '@mui/joy/Button'
import { createToken } from '../manifests/tokens'
import { useRdt } from '../rdt/hooks/useRdt'
import { Alert, Stack } from '@mui/joy'
import { useLogger } from '../components/Logger'
import { Card } from '../components/Card'
import { SelectAccount } from '../account/SelectAccount'

type CreateTokenBase = {
  name: string
  description: string
  iconUrl: string
}

type Nft = CreateTokenBase & {
  items: { id: string; value: string; name: string; description: string }[]
}

const nftDefaultValues = {
  name: 'SandboxNFT',
  description: 'A very innovative and important resource',
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/be/VeKings.png',
  items: [
    {
      id: 'a0b0c0d0-e0f0-0g0h0i0-j0k0l0m0n0',
      name: 'URL With white space',
      description: 'URL with white space',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/KL Haze-medium.jpg',
    },
    {
      id: '27df6f08-6df3-4699-b172-e885ac3fe7d4',
      name: 'Filling Station Breakfast Large',
      description: 'Filling Station Breakfast Large',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Filling+Station+Breakfast-large.jpg',
    },
    {
      id: '9859ad23-ffc9-4297-90be-1aaec6e768fd',
      name: 'Filling Station Breakfast Medium',
      description: 'Filling Station Breakfast Medium',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Filling+Station+Breakfast-medium.jpg',
    },
    {
      id: 'f1691a1c-1ae9-4a5c-8e50-33b1a10c2ff7',
      name: 'Filling Station Breakfast Small',
      description: 'Filling Station Breakfast Small',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Filling+Station+Breakfast-small.jpg',
    },
    {
      id: '8efeb2c7-ab20-4db6-81cd-8c6d9d851ec1',
      name: 'Frame 6 Large',
      description: 'Frame 6 Large',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Frame+6-large.png',
    },
    {
      id: 'cc88ca59-afe5-4641-9ec6-e120db310ec7',
      name: 'Frame 6 Medium',
      description: 'Frame 6 Medium',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Frame+6-medium.png',
    },
    {
      id: '9f843b05-1df9-4da4-9ad1-13d845d78441',
      name: 'Frame 6 Small',
      description: 'Frame 6 Small',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Frame+6-small.png',
    },
    {
      id: 'cc3591ba-d5f5-4082-9ce7-88d0c83f62f3',
      name: 'Kway Teow Large',
      description: 'Kway Teow Large',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Fried+Kway+Teow-large.jpg',
    },
    {
      id: '339f5646-bfe3-4fb2-91bc-f2f0a201eb71',
      name: 'Kway Teow Medium',
      description: 'Kway Teow Medium',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Fried+Kway+Teow-medium.jpg',
    },
    {
      id: '4705f946-9e75-4458-ba18-532f6bf613d6',
      name: 'Kway Teow Small',
      description: 'Kway Teow Small',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Fried+Kway+Teow-small.jpg',
    },
    {
      id: '3e7971ac-c25f-42b7-9eb0-be645bbd83e8',
      name: 'ICON Transparency PNG',
      description: 'ICON Transparency PNG',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/ICON-transparency.png',
    },
    {
      id: '31ba8b9f-1c08-4e69-b6f4-484952039764',
      name: 'KL Haze Large',
      description: 'KL Haze Large',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/KL+Haze-large.jpg',
    },
    {
      id: '6a1973d2-178c-47da-8a80-b620c6b640b4',
      name: 'KL Haze Medium',
      description: 'KL Haze Medium',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/KL+Haze-medium.jpg',
    },
    {
      id: 'ad0bd4b9-e876-4c61-bdc3-08b8653bff40',
      name: 'KL Haze Small',
      description: 'KL Haze Small',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/KL+Haze-small.jpg',
    },
    {
      id: '61cc9bd0-1031-4fec-9ba0-f797e5457464',
      name: 'modern kunst musem pano 2',
      description: 'modern kunst musem pano 2',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/modern_kunst_museum_pano-2.jpg',
    },
    {
      id: '2a392126-4b2f-4491-8c25-60314a0cbfff',
      name: 'modern kunst musem pano 3',
      description: 'modern kunst musem pano 3',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/modern_kunst_museum_pano-3.jpg',
    },
    {
      id: '3e0d49cf-80ca-4d1d-b75d-fcbdd58bbbf1',
      name: 'modern kunst musem pano 0',
      description: 'modern kunst musem pano 0',
      value:
        'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/modern_kunst_museum_pano.jpg',
    },
    {
      id: '0c4a66e9-1240-405e-b1ab-87c01a0b96d5',
      name: 'Scryptonaut Patch SVG',
      description: 'Scryptonaut Patch SVG',
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
    account: string
  }>({
    nft: nftDefaultValues,
    account: '',
  })
  return (
    <Card title="Create NFT">
      <Stack spacing={2}>
        {state.nft.items.some((i) => i.value.includes(' ')) ||
        state.nft.iconUrl.includes(' ') ? (
          <Alert color="warning" variant="soft">
            URLs with empty spaces may not be displayed correctly in the Radix
            Wallet
          </Alert>
        ) : null}
        <SelectAccount
          label="NFT Owner Account"
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
            label: 'Icon URL',
            key: 'iconUrl',
            type: 'text',
          },
        ].map((item) => (
          <FormControl key={item.key}>
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
            <Stack
              sx={{ mb: 2 }}
              spacing={2}
              direction="row"
              key={item.id}
              justifyContent="center"
            >
              <FormControl sx={{ width: '100%' }}>
                <FormLabel>Image URL #{index + 1} </FormLabel>
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
              </FormControl>
              <FormControl>
                <FormLabel>Name #{index + 1} </FormLabel>
                <Input
                  fullWidth
                  size="sm"
                  defaultValue={item.name}
                  onChange={(e) => {
                    setState((s) => {
                      return {
                        ...s,
                        nft: {
                          ...s.nft,
                          items: s.nft.items.map((v) =>
                            v.id === item.id
                              ? { ...v, name: e.target.value }
                              : v
                          ),
                        },
                      }
                    })
                  }}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description #{index + 1} </FormLabel>
                <Input
                  fullWidth
                  size="sm"
                  defaultValue={item.description}
                  onChange={(e) => {
                    setState((s) => {
                      return {
                        ...s,
                        nft: {
                          ...s.nft,
                          items: s.nft.items.map((v) =>
                            v.id === item.id
                              ? { ...v, description: e.target.value }
                              : v
                          ),
                        },
                      }
                    })
                  }}
                />
              </FormControl>
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
                        name: '',
                        description: '',
                      })
                    }
                    return updated
                  })
                }}
              >
                X
              </Button>
            </Stack>
          ))}
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
                  items: [
                    ...s.nft.items,
                    {
                      id: crypto.randomUUID(),
                      name: '',
                      description: '',
                      value: '',
                    },
                  ],
                },
              }
            })
          }}
        >
          Add item
        </Button>
        <Button
          disabled={!state.account}
          fullWidth
          onClick={async () => {
            const values = state.nft
            await rdt.walletApi
              .sendTransaction({
                transactionManifest: createToken(state.account).nft({
                  name: values.name,
                  description: values.description,
                  iconUrl: values.iconUrl,
                  items: values.items,
                }),
                version: 1,
              })
              .mapErr((error) => addLog(JSON.stringify(error, null, 2)))
          }}
        >
          Create
        </Button>
        {Logger}
      </Stack>
    </Card>
  )
}
