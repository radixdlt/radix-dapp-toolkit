import * as React from 'react'
import Box from '@mui/joy/Box'
import RadioGroup from '@mui/joy/RadioGroup'
import Radio from '@mui/joy/Radio'
import Input from '@mui/joy/Input'
import Checkbox from '@mui/joy/Checkbox'
import FormControl from '@mui/joy/FormControl'
import FormLabel from '@mui/joy/FormLabel'
import { Card } from '../components/Card'
import { dataRequestStateClient } from '../rdt/rdt'
import { DataRequestBuilder } from '../../src'

type Props = {
  state: {
    enabled: boolean
    data: {
      numberOfAccounts: {
        quantity: number
        quantifier: 'atLeast' | 'exactly'
      }
      withProof: boolean
    }
  }
  updateState: (state: {
    enabled: boolean
    data: {
      numberOfAccounts: {
        quantity: number
        quantifier: 'atLeast' | 'exactly'
      }
      withProof: boolean
    }
  }) => void
}

export const AccountsCard = ({ state, updateState }: Props) => {
  const disabled = !state.enabled
  return (
    <Card
      title="Accounts"
      side={
        <Checkbox
          checked={state.enabled}
          onChange={(ev) => {
            if (!ev.target.checked)
              dataRequestStateClient.removeState('accounts')
            else
              dataRequestStateClient.patchState(DataRequestBuilder.accounts())
          }}
        />
      }
    >
      <Box sx={{ p: 1 }}>
        <Box sx={{ mb: 4 }}>
          <FormControl disabled={disabled}>
            <FormLabel>Quantity</FormLabel>
            <Input
              type="number"
              size="sm"
              value={state.data.numberOfAccounts.quantity || 0}
              onChange={(ev) => {
                updateState({
                  ...state,
                  data: {
                    ...state.data,
                    numberOfAccounts: {
                      ...state.data.numberOfAccounts,
                      quantity: parseInt(ev.target.value, 10),
                    },
                  },
                })
              }}
            />
          </FormControl>
        </Box>

        <Box sx={{ mb: 4, mt: 4 }}>
          <RadioGroup
            name="accountsQuantifier"
            value={state.data.numberOfAccounts.quantifier ?? null}
            onChange={(ev) => {
              updateState({
                ...state,
                data: {
                  ...state.data,
                  numberOfAccounts: {
                    ...state.data.numberOfAccounts,
                    quantifier: ev.target.value as any,
                  },
                },
              })
            }}
          >
            <Radio
              disabled={disabled}
              label="At least"
              value="atLeast"
              size="sm"
            />
            <Radio
              disabled={disabled}
              label="Exactly"
              value="exactly"
              size="sm"
            />
          </RadioGroup>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Checkbox
            disabled={disabled}
            label="With proof"
            size="sm"
            checked={state.data.withProof}
            onChange={(ev) => {
              updateState({
                ...state,
                data: { ...state.data, withProof: ev.target.checked },
              })
            }}
          />
        </Box>
      </Box>
    </Card>
  )
}
