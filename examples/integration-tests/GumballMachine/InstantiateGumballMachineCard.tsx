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
import { getInstantiateGumballMachineManifest } from '../../manifests/deploy-package'

const DEFAULT_GUMBALL_IMAGE =
  'https://static.vecteezy.com/system/resources/previews/010/283/423/original/sweet-candy-graphics-illustration-free-vector.jpg'

export const InstantiateGumballMachineCard = () => {
  const rdt = useRdt()
  const gumballMachineState = useGumballMachineState()
  const { Logger, addLog, reset } = useLogger()
  const accounts = useAccounts()
  const [state, setState] = React.useState({
    ownerAccount: '',
    gumballPrice: 1,
    gumballFlavour: 'GUM',
    gumballImage: DEFAULT_GUMBALL_IMAGE,
  })

  const getAccounts = () => {
    addLog('getting account from wallet...')
    return rdt.walletApi.sendOneTimeRequest(accountsBuilder().exactly(1))
  }

  const instantiateComponent = (address: string) => {
    return rdt.walletApi
      .sendTransaction({
        transactionManifest: getInstantiateGumballMachineManifest(
          address,
          state.gumballPrice,
          state.gumballFlavour,
          state.gumballImage,
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
        const state_updates = values.transaction.receipt?.state_updates as {
          new_global_entities: { entity_address: string; entity_type: string }[]
        }

        const createdEntities = state_updates.new_global_entities.map(
          (entity) => entity.entity_address
        )
        const entities = {
          dApp: createdEntities[1],
          adminBadge: createdEntities[2],
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

          <FormControl>
            <FormLabel>Gumball Image</FormLabel>
            <Input
              onChange={(ev) => {
                setState((prev) => ({
                  ...prev,
                  gumballImage: ev.target.value || DEFAULT_GUMBALL_IMAGE,
                }))
              }}
              sx={{ mb: 1 }}
              placeholder="Gumball Image URL"
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
