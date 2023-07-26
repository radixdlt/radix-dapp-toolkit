import * as React from 'react'
import Button from '@mui/joy/Button'
import { useRdt } from '../../rdt/hooks/useRdt'
import { Card } from '../../components/Card'
import { GumballMachineComponentState, useGumballMachineState } from '../state'
import { useLogger } from '../../components/Logger'
import { Code } from '../../components/Code'
import { Box, FormControl, FormLabel } from '@mui/joy'
import { SelectGumballComponent } from './SelectGumballComponent'
import { SelectAccount } from '../../account/SelectAccount'
import { gatewayApi } from '../../rdt/rdt'

export type GumballMachineExampleConfig = {
  componentAlpha?: GumballMachineComponentState
  componentBravo?: GumballMachineComponentState
  accountAlpha?: string
  accountBravo?: string
}

export const GumballMachineExample = ({
  title,
  description,
  visibleInputFields,
  transactionManifest,
  configChange,
}: {
  title: string
  description: string
  visibleInputFields: string[]
  transactionManifest: string
  configChange: (component: GumballMachineExampleConfig) => void
}) => {
  const rdt = useRdt()
  const [config, setConfig] = React.useState<GumballMachineExampleConfig>({})
  const gumballMachineState = useGumballMachineState()

  const { Logger, addLog } = useLogger()

  const exec = () => {
    addLog(transactionManifest)
    rdt.walletApi
      .sendTransaction({
        transactionManifest,
        version: 1,
      })
      .andThen(({ transactionIntentHash }) =>
        gatewayApi.getTransactionDetails(transactionIntentHash)
      )
      .map((response) =>
        addLog(`transaction status: ${response.transaction.transaction_status}`)
      )
      .mapErr((error) => addLog(JSON.stringify(error, null, 2)))
  }

  return (
    <Card title={title}>
      {visibleInputFields.includes('componentAlpha') && (
        <FormControl>
          <FormLabel>Machine Alpha</FormLabel>
          <SelectGumballComponent
            sx={{ mb: 1 }}
            onChange={(componentAlpha) => {
              setConfig({ ...config, componentAlpha })
              configChange({ ...config, componentAlpha })
            }}
          ></SelectGumballComponent>
        </FormControl>
      )}
      {visibleInputFields.includes('componentBravo') && (
        <FormControl>
          <FormLabel>Machine Bravo</FormLabel>
          <SelectGumballComponent
            sx={{ mb: 1 }}
            onChange={(componentBravo) => {
              setConfig({ ...config, componentBravo })
              configChange({ ...config, componentBravo })
            }}
          ></SelectGumballComponent>
        </FormControl>
      )}
      {visibleInputFields.includes('accountAlpha') && (
        <FormControl>
          <FormLabel>Alpha Account</FormLabel>
          <SelectAccount
            onChange={(account) => {
              setConfig({ ...config, accountAlpha: account })
              configChange({ ...config, accountAlpha: account })
            }}
            sx={{ mb: 1 }}
          ></SelectAccount>
        </FormControl>
      )}
      {visibleInputFields.includes('accountBravo') && (
        <FormControl>
          <FormLabel>Bravo Account</FormLabel>
          <SelectAccount
            onChange={(account) => {
              setConfig({ ...config, accountBravo: account })
              configChange({ ...config, accountBravo: account })
            }}
            sx={{ mb: 1 }}
          ></SelectAccount>
        </FormControl>
      )}

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
