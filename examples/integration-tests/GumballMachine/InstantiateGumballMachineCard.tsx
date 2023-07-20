import * as React from 'react'
import Button from '@mui/joy/Button'
import { useRdt } from '../../rdt/hooks/useRdt'
import { Card } from '../../components/Card'
import {
  setGumballMachineState,
  addGumballMachineComponent,
  useGumballMachineState,
} from '../state'
import { useLogger } from '../../components/Logger'
import { Box, Input, FormControl, FormLabel } from '@mui/joy'
import { useAccounts } from '../../account/state'
import { SelectAccount } from '../../account/SelectAccount'
import { accounts as accountsBuilder } from '../../../src/data-request/builders/accounts'
import { gatewayApi } from '../../rdt/rdt'

const getInstantiateGumballMachineManifest = (
  ownerAddress: string,
  gumballPrice: number,
  gumballFlavour: string,
  gumballMachinePackageAddress: string
) => `
  CALL_FUNCTION Address("${gumballMachinePackageAddress}") "GumballMachine" "instantiate_gumball_machine" Decimal("${gumballPrice}") "${gumballFlavour}" "${ownerAddress}";
  CALL_METHOD Address("${ownerAddress}") "deposit_batch" Expression("ENTIRE_WORKTOP");
`

export const InstantiateGumballMachineCard = () => {
  const rdt = useRdt()
  const gumballMachineState = useGumballMachineState()
  const { Logger, addLog, reset } = useLogger()
  const accounts = useAccounts()
  const [state, setState] = React.useState({
    ownerAccount: '',
    gumballPrice: 1,
    gumballFlavour: 'GUM',
  })

  const getAccounts = () => {
    addLog('getting account from wallet...')
    return rdt.walletData.oneTimeRequest(accountsBuilder().exactly(1))
  }

  const instantiateComponent = (address: string) => {
    return rdt
      .sendTransaction({
        transactionManifest: getInstantiateGumballMachineManifest(
          address,
          state.gumballPrice,
          state.gumballFlavour,
          gumballMachineState.gumballMachinePackageAddress
        ),
        version: 1,
      })
      .andThen(({ transactionIntentHash }) =>
        gatewayApi.getTransactionDetails(transactionIntentHash)
      )
  }

  const exec = () => {
    addLog(`instantiating gumball machine component`)
    return instantiateComponent(state.ownerAccount)
      .map((values) => {
        const createdEntities = (
          values.transaction.receipt?.state_updates as any
        )?.new_global_entities.map((entity) => entity.entity_address)
        const entities = {
          adminBadge: createdEntities[1],
          staffBadge: createdEntities[2],
          gumballToken: createdEntities[3],
        }

        addGumballMachineComponent({
          address: createdEntities[0],
          entities,
          gumballPrice: state.gumballPrice,
          gumballFlavour: state.gumballFlavour,
          ownerAccountAddress: state.ownerAccount,
        })
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
            setGumballMachineState({
              gumballMachinePackageAddress:
                gumballMachineState.gumballMachinePackageAddress,
              components: {},
            })
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
          <FormControl>
            <FormLabel>Gumball Price</FormLabel>
            <Input
              type="number"
              onChange={(ev) => {
                setState((prev) => ({
                  ...prev,
                  gumballPrice: Number(ev.target.value) ?? 1,
                }))
              }}
              sx={{ mb: 1 }}
              placeholder="Type Gumball price... (default: 1)"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Gumball Flavour</FormLabel>
            <Input
              onChange={(ev) => {
                setState((prev) => ({
                  ...prev,
                  gumballFlavour: ev.target.value || 'GUM',
                }))
              }}
              sx={{ mb: 1 }}
              placeholder="Type Gumball Flavour... (default: GUM)"
            />
          </FormControl>

          <Button disabled={!state.ownerAccount} fullWidth onClick={exec}>
            Run flow
          </Button>
        </Box>
      ) : (
        <Button fullWidth onClick={getAccounts} sx={{ mb: 2 }}>
          Connect
        </Button>
      )}
      {Logger}
    </Card>
  )
}
