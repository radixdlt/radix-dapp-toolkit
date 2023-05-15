import * as React from 'react'
import Box from '@mui/joy/Box'
import Divider from '@mui/joy/Divider'
import RadioGroup from '@mui/joy/RadioGroup'
import Radio from '@mui/joy/Radio'
import Input from '@mui/joy/Input'
import Checkbox from '@mui/joy/Checkbox'
import FormControl from '@mui/joy/FormControl'
import FormLabel from '@mui/joy/FormLabel'
import { accountsState, useAccountsState } from './state'
import { Buffer } from 'buffer'
import { Card } from '../components/Card'
import { createChallenge } from '../helpers/create-challenge'

export const AccountsCard = () => {
  const { enabled, reset, quantifier, quantity, oneTime, challenge } =
    useAccountsState()
  return (
    <Card
      title="Accounts"
      side={
        <Checkbox
          checked={enabled}
          onChange={(ev) => {
            accountsState.next({
              ...accountsState.value,
              enabled: ev.target.checked,
            })
          }}
        />
      }
    >
      <Box sx={{ p: 1 }}>
        <Box sx={{ mb: 4 }}>
          <FormControl disabled={!enabled}>
            <FormLabel>Quantity</FormLabel>
            <Input
              type="number"
              size="sm"
              value={quantity}
              onChange={(ev) => {
                accountsState.next({
                  ...accountsState.value,
                  quantity: parseInt(ev.target.value, 10),
                })
              }}
            />
          </FormControl>
        </Box>

        <Box sx={{ mb: 4, mt: 4 }}>
          <RadioGroup
            name="accountsQuantifier"
            value={quantifier}
            onChange={(ev) => {
              accountsState.next({
                ...accountsState.value,
                quantifier: ev.target.value,
              })
            }}
          >
            <Radio
              disabled={!enabled}
              label="At least"
              value="atLeast"
              size="sm"
            />
            <Radio
              disabled={!enabled}
              label="Exactly"
              value="exactly"
              size="sm"
            />
          </RadioGroup>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Checkbox
            label="With proof of ownership"
            size="sm"
            checked={!!challenge}
            onChange={(ev) => {
              accountsState.next({
                ...accountsState.value,
                challenge: ev.target.checked ? createChallenge() : undefined,
              })
            }}
          />
        </Box>

        <Box>
          <Checkbox
            disabled={!enabled}
            label="One time request"
            size="sm"
            checked={oneTime}
            onChange={(ev) => {
              accountsState.next({
                ...accountsState.value,
                oneTime: ev.target.checked,
              })
            }}
          />
        </Box>

        <Box>
          <Checkbox
            disabled={!enabled}
            label="Reset"
            size="sm"
            checked={reset}
            onChange={(ev) => {
              accountsState.next({
                ...accountsState.value,
                reset: ev.target.checked,
              })
            }}
          />
        </Box>
      </Box>
    </Card>
  )
}
