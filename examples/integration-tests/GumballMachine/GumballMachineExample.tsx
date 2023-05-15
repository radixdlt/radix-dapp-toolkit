import * as React from 'react'
import Button from '@mui/joy/Button'
import { useRdt } from '../../rdt/hooks/useRdt'
import { Card } from '../../components/Card'
import { useGumballMachineState } from '../state'
import { useLogger } from '../../components/Logger'
import { Code } from '../../components/Code'
import { Box } from '@mui/joy'

export const GumballMachineExample = ({
  title,
  description,
  transactionManifest,
}: {
  title: string
  description: string
  transactionManifest: string
}) => {
  const rdt = useRdt()

  const gumballMachineState = useGumballMachineState()

  const { Logger, addLog } = useLogger()

  const exec = () => {
    addLog(transactionManifest)
    rdt
      .sendTransaction({
        transactionManifest,
        version: 1,
      })
      .andThen(({ transactionIntentHash }) =>
        rdt.gatewayApi.getTransactionDetails(transactionIntentHash)
      )
      .map((response) =>
        addLog(`transaction status: ${response.transaction.transaction_status}`)
      )
      .mapErr((error) => addLog(JSON.stringify(error, null, 2)))
  }

  return (
    <Card title={title}>
      <Box sx={{ mb: 1 }}>
        <Code>{description}</Code>
      </Box>
      {Logger}
      <Button fullWidth disabled={!gumballMachineState} onClick={exec}>
        Run flow
      </Button>
    </Card>
  )
}
