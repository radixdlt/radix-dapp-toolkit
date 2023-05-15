import * as React from 'react'
import Button from '@mui/joy/Button'
import { useRdt } from '../../rdt/hooks/useRdt'
import { Card } from '../../components/Card'
import { useGumballMachineState } from '../state'
import { useLogger } from '../../components/Logger'
import { Code } from '../../components/Code'
import { GumballMachineTransactionManifests } from '../../manifests/gumball-machine'
import Input from '@mui/joy/Input'

export const SetPriceCard = () => {
  const rdt = useRdt()

  const [state, setState] = React.useState<number>(10)
  const gumballMachineState = useGumballMachineState()
  const { Logger, addLog } = useLogger()

  if (!gumballMachineState) return null

  const { setPrice } = GumballMachineTransactionManifests(gumballMachineState)
  const transactionManifest = setPrice(state)

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
    <Card title={'Set Price'}>
      <Input
        placeholder="Enter dApp Definition Address"
        required
        defaultValue={state}
        sx={{ mb: 1, fontSize: 'var(--joy-fontSize-sm)' }}
        type="number"
        onChange={(event) => {
          const value = parseInt(event.target.value || '10', 10)
          setState(value)
        }}
      />
      {Logger}
      <Button fullWidth disabled={!gumballMachineState} onClick={exec}>
        Run flow
      </Button>
    </Card>
  )
}
