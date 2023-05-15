import * as React from 'react'
import Box from '@mui/joy/Box'
import Checkbox from '@mui/joy/Checkbox'
import { accountsState, loginState, useLoginState } from './state'
import { Card } from '../components/Card'
import { createChallenge } from '../helpers/create-challenge'

export const LoginCard = () => {
  const { challenge } = useLoginState()
  return (
    <Card title="Login">
      <Box>
        <Checkbox
          label="With challenge"
          size="sm"
          checked={!!challenge}
          onChange={(ev) => {
            loginState.next({
              ...accountsState.value,
              challenge: ev.target.checked ? createChallenge() : undefined,
            })
          }}
        />
      </Box>
    </Card>
  )
}
