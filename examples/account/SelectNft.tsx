import { Select, Option } from '@mui/joy'
import React from 'react'
import { SxProps } from '@mui/joy/styles/types'
import { useEntities } from '../entity/state'

export const SelectNft = ({
  placeholder = 'Select NFT...',
  sx = {},
  onChange,
  accountAddress,
  nftCollectionAddress,
}: {
  placeholder?: string
  sx?: SxProps
  onChange: (account: string) => void
  accountAddress: string
  nftCollectionAddress: string
}) => {
  const entity = useEntities()

  const nfts = Object.values(entity.nft).filter(
    (item) =>
      item.ownerAddress === accountAddress &&
      item.nftCollectionAddress === nftCollectionAddress
  )

  return (
    <Select
      placeholder={placeholder}
      sx={sx}
      onChange={(_, value) => {
        onChange(value as string)
      }}
    >
      {nfts.map((item) => (
        <Option key={item.address} value={item.address}>
          {item.nftId}
        </Option>
      ))}
    </Select>
  )
}
