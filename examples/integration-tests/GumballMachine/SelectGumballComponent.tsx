import React from 'react'
import { Select, Option } from '@mui/joy'
import { GumballMachineComponentState, useGumballMachineState } from '../state'
import { SxProps } from '@mui/joy/styles/types'
import { shortenAddress } from '../../helpers/shorten-address'

export const SelectGumballComponent = ({
  sx = {},
  onChange,
  value,
}: {
  placeholder?: string
  sx?: SxProps
  onChange: (account: GumballMachineComponentState) => void
  value?: GumballMachineComponentState
}) => {
  const { components } = useGumballMachineState()
  return (
    <Select
      placeholder="Select gumball component..."
      sx={sx}
      value={value}
      onChange={(_, value) => {
        console.log(value)
        if (value) {
          onChange(value)
        }
      }}
    >
      {Object.entries(components).map(([address, component]) => (
        <Option key={address} value={component}>
          {shortenAddress(address)}
        </Option>
      ))}
    </Select>
  )
}
