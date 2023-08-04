import { Select, Option, FormControl, FormLabel } from '@mui/joy'
import React from 'react'
import { useAccounts } from './state'
import { SxProps } from '@mui/joy/styles/types'
import { addEntities } from '../entity/state'
import { shortenAddress } from '../helpers/shorten-address'

export const SelectAccount = ({
  label = '',
  placeholder = 'Select account…',
  sx = {},
  onChange,
  variant,
  value,
}: {
  placeholder?: string
  label?: string
  sx?: SxProps
  variant?: 'plain' | 'outlined'
  onChange: (account: string) => void
  value?: string
}) => {
  const accounts = useAccounts()

  return (
    <FormControl>
      {label ? <FormLabel>{label}</FormLabel> : ''}
      <Select
        placeholder={placeholder}
        sx={sx}
        variant={variant}
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
    </FormControl>
  )
}
