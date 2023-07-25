import { Box, Button, Input, Stack, Typography } from '@mui/joy'
import { Card } from '../../components/Card'
import React from 'react'
import { GumballMachineComponentState, setGumballPrice } from '../state'
import Layout from '../../components/Layout'
import { GumballMachineTransactionManifests } from '../../manifests/gumball-machine'
import { useRdt } from '../../rdt/hooks/useRdt'
import { useLogger } from '../../components/Logger'
import { TransactionStatus } from '@radixdlt/babylon-gateway-api-sdk'
import { GumballMachineInfoBox } from './GumballMachineInfoBox'
import { gatewayApi } from '../../rdt/rdt'
export const GumballMachineCard = (
  gumballMachine: GumballMachineComponentState
) => {
  const rdt = useRdt()
  const { Logger, addLog } = useLogger()
  const [currentPrice, setCurrentPrice] = React.useState<number>(
    gumballMachine.gumballPrice
  )
  const { setPrice, setRelatedEntities } =
    GumballMachineTransactionManifests(gumballMachine)
  const transactionManifest = setPrice(currentPrice)
  const updateClaimedEntities = () => {
    const tx = setRelatedEntities()
    addLog(tx)
    rdt.walletApi
      .sendTransaction({
        transactionManifest: tx,
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
      .map((response) => {
        if (
          response.transaction.transaction_status ===
          TransactionStatus.CommittedSuccess
        ) {
          setGumballPrice(gumballMachine.address, currentPrice)
        }
        addLog(`transaction status: ${response.transaction.transaction_status}`)
      })
      .mapErr((error) => addLog(JSON.stringify(error, null, 2)))
  }
  return (
    <Card
      title={`${gumballMachine.gumballFlavour} - ${gumballMachine.gumballPrice} XRD`}
    >
      <Stack spacing={2}>
        <GumballMachineInfoBox
          label="Component Address"
          address={gumballMachine.address}
        ></GumballMachineInfoBox>

        <Layout.Row>
          <GumballMachineInfoBox
            label="Owner"
            address={gumballMachine.ownerAccountAddress}
          ></GumballMachineInfoBox>
          <GumballMachineInfoBox
            label="Admin Badge"
            address={gumballMachine.entities.adminBadge}
          ></GumballMachineInfoBox>
        </Layout.Row>
        <Layout.Row>
          <GumballMachineInfoBox
            label="Gumball Token"
            address={gumballMachine.entities.gumballToken}
          ></GumballMachineInfoBox>
        </Layout.Row>
        <Layout.Row>
          <Box>
            <Typography level="h6">Gumball Price</Typography>
            <Input
              placeholder="Set gumball price..."
              required
              defaultValue={gumballMachine.gumballPrice}
              type="number"
              onChange={(event) => {
                const value = parseInt(event.target.value || '10', 10)
                setCurrentPrice(value)
              }}
            />
          </Box>

          <Box>
            <Typography level="h6">&nbsp;</Typography>
            <Button
              sx={{ ml: 1 }}
              disabled={!gumballMachine.gumballPrice}
              onClick={exec}
            >
              Update
            </Button>
          </Box>
        </Layout.Row>
        <Button onClick={updateClaimedEntities}>
          Set Related Entities on owner account
        </Button>
      </Stack>
    </Card>
  )
}
