import { Select, Option } from '@mui/joy'
import React from 'react'
import { useAccounts } from './state'
import { SxProps } from '@mui/joy/styles/types'
import { addEntities } from '../entity/state'
import { shortenAddress } from '../helpers/shorten-address'

export const SelectAccount = ({
  placeholder = 'Select account…',
  sx = {},
  onChange,
  value,
}: {
  placeholder?: string
  sx?: SxProps
  onChange: (account: string) => void
  value?: string
}) => {
  const accounts = useAccounts()

  return (
      <Select
        placeholder={placeholder}
        sx={sx}
        value={value}
        onChange={(_, value) => {
          const accountAddress = value
          if (accountAddress && onChange) {
            onChange(accountAddress)
            addEntities([{ type: 'account', address: accountAddress }])
          }
        }}
      >
        {accounts.map((account) => (
          <Option key={account.address} value={account.address}>
            {account.label} ({shortenAddress(account.address)})
          </Option>
        ))}
      </Select>
  )
}
