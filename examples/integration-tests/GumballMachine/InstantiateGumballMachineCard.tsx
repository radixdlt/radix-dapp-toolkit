import * as React from 'react'
import Button from '@mui/joy/Button'
import { useRdt } from '../../rdt/hooks/useRdt'
import { Card } from '../../components/Card'
import {
  setGumballMachineState,
  // useGumballMachinePackageAddress,
  useGumballMachineState,
} from '../state'
import { ManifestValue, ManifestBuilder } from '@radixdlt/wallet-sdk'
import { useLogger } from '../../components/Logger'
import { Code } from '../../components/Code'
import { useXrdAddress } from '../../network/state'
import { Box, Select, Option } from '@mui/joy'
import { useEntities } from '../../entity/state'
import { useAccounts } from '../../account/state'
import { SelectAccount } from '../../account/SelectAccount'

const getInstantiateGumballMachineManifest = (
  ownerAddress: string,
  gumballMachinePackageAddress: string
) =>
  new ManifestBuilder()
    .callFunction(
      gumballMachinePackageAddress,
      'GumballMachine',
      'instantiate_gumball_machine',
      [ManifestValue.Decimal(1), `"GUM"`]
    )
    .callMethod(ownerAddress, 'deposit_batch', [
      ManifestValue.Expression('ENTIRE_WORKTOP'),
    ])
    .build()
    .toString()

export const InstantiateGumballMachineCard = () => {
  const rdt = useRdt()
  // const gumballMachinePackageAddress = useGumballMachinePackageAddress()
  const gumballMachineState = useGumballMachineState()
  const { Logger, addLog, reset } = useLogger()
  const xrdAddress = useXrdAddress()
  const entities = useEntities()
  const accounts = useAccounts()
  const [state, setState] = React.useState({ ownerAccount: '' })

  const getAccounts = () => {
    addLog('getting account from wallet...')
    return rdt.requestData({
      accounts: { quantifier: 'atLeast', quantity: 1 },
    })
  }

  const instantiateComponent = (address: string) => {
    return rdt
      .sendTransaction({
        transactionManifest: getInstantiateGumballMachineManifest(address, ''),
        version: 1,
      })
      .andThen(({ transactionIntentHash }) =>
        rdt.gatewayApi.getTransactionDetails(transactionIntentHash)
      )
  }

  const exec = () => {
    addLog(`instantiating gumball machine component`)
    return instantiateComponent(state.ownerAccount)
      .map((values) => {
        // setGumballMachineState(values)
      })
      .mapErr((err) => {
        addLog(`${JSON.stringify(err, null, 2)}`)
      })
  }

  return (
    <Card
      title="Instantiate Gumball Machine"
      side={
        <Button
          variant="outlined"
          onClick={() => {
            reset()
            // setGumballMachineState()
          }}
        >
          Reset
        </Button>
      }
    >
      {accounts.length ? (
        <Box sx={{ mb: 2 }}>
          <SelectAccount
            placeholder="Select owner account…"
            sx={{ mb: 1 }}
            value={state.ownerAccount}
            onChange={(value) => {
              setState((prev) => ({ ...prev, ownerAccount: value as string }))
            }}
          />
          <Button
            disabled={!state.ownerAccount || true}
            fullWidth
            onClick={exec}
          >
            Run flow
          </Button>
        </Box>
      ) : (
        <Button fullWidth onClick={getAccounts} sx={{ mb: 2 }}>
          Connect
        </Button>
      )}
      {gumballMachineState && (
        <Box sx={{ mb: 1 }}>
          <Code>
            {JSON.stringify({ ...gumballMachineState, entities }, null, 2)}
          </Code>
        </Box>
      )}
      {Logger}
    </Card>
  )
}
