import * as React from 'react'
import Box from '@mui/joy/Box'
import RadioGroup from '@mui/joy/RadioGroup'
import Radio from '@mui/joy/Radio'
import Input from '@mui/joy/Input'
import Checkbox from '@mui/joy/Checkbox'
import FormControl from '@mui/joy/FormControl'
import FormLabel from '@mui/joy/FormLabel'
import { useDataRequestState } from './state'
import { Card } from '../components/Card'
import { rdt, dataRequestStateClient } from '../rdt/rdt'
import { DataRequestBuilder } from '../../src'

export const AccountsCard = () => {
  const dataRequestState = useDataRequestState()
  const disabled = !dataRequestState.accounts
  return (
    <Card
      title="Accounts"
      side={
        <Checkbox
          checked={!!dataRequestState.accounts}
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
              value={dataRequestState.accounts?.numberOfAccounts.quantity || 0}
              onChange={(ev) => {
                dataRequestStateClient.patchState(
                  DataRequestBuilder.config({
                    accounts: {
                      ...(dataRequestState.accounts || {}),
                      numberOfAccounts: {
                        quantifier:
                          dataRequestState.accounts!.numberOfAccounts
                            .quantifier,
                        quantity: parseInt(ev.target.value, 10),
                      },
                    },
                  })
                )
              }}
            />
          </FormControl>
        </Box>

        <Box sx={{ mb: 4, mt: 4 }}>
          <RadioGroup
            name="accountsQuantifier"
            value={
              dataRequestState.accounts?.numberOfAccounts.quantifier ?? null
            }
            onChange={(ev) => {
              dataRequestStateClient.patchState(
                DataRequestBuilder.config({
                  accounts: {
                    ...dataRequestState.accounts!,
                    numberOfAccounts: {
                      ...dataRequestState.accounts!.numberOfAccounts,
                      quantifier: ev.target.value as any,
                    },
                  },
                })
              )
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
            checked={!!dataRequestState.accounts?.withProof}
            onChange={(ev) => {
              dataRequestStateClient.patchState(
                DataRequestBuilder.config({
                  accounts: {
                    ...dataRequestState.accounts!,
                    withProof: ev.target.checked,
                  },
                })
              )
            }}
          />
        </Box>

        <Box>
          <Checkbox
            disabled={disabled}
            label="Reset"
            size="sm"
            checked={!!dataRequestState.accounts?.reset}
            onChange={(ev) => {
              dataRequestStateClient.patchState(
                DataRequestBuilder.config({
                  accounts: {
                    ...dataRequestState.accounts!,
                    reset: ev.target.checked,
                  },
                })
              )
            }}
          />
        </Box>
      </Box>
    </Card>
  )
}
