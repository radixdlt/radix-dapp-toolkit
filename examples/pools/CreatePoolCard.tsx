import {
  FormControl,
  Select,
  Option,
  Input,
  Button,
  FormLabel,
  Stack,
  Divider,
  Chip,
} from '@mui/joy'
import { Card } from '../components/Card'
import * as React from 'react'
import { useState } from 'react'
import { usePoolPackageAddress, useXrdAddress } from '../network/state'
import { createPoolManifest } from './manifests'
import { useEntities } from '../entity/state'
import { useLogger } from '../components/Logger'
import { gatewayApi, rdt } from '../rdt/rdt'
import { TransactionStatus } from '@radixdlt/babylon-gateway-api-sdk'
import { addPoolComponent } from './state'
export const CreatePoolCard = () => {
  const [isLoading, setIsLoading] = useState(false)

  const { addLog } = useLogger()
  const entities = useEntities()
  const [poolType, setPoolType] = useState<
    'OneResourcePool' | 'TwoResourcePool' | 'MultiResourcePool'
  >('TwoResourcePool')
  const poolPackageAddress = usePoolPackageAddress()
  const xrdAddress = useXrdAddress()
  const [resourceAddresses, setResourceAddresses] = useState<
    Record<string, string>
  >({
    0: '',
    1: '',
  })
  const instantiatePool = () => {
    setIsLoading(true)
    const transactionManifest = createPoolManifest(
      poolPackageAddress,
      poolType,
      ...Object.values(resourceAddresses)
    )
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
          addLog('Pool created successfully')
          const state_updates = response.transaction.receipt?.state_updates as {
            new_global_entities: {
              entity_address: string
              entity_type: string
            }[]
          }

          const createdEntities = state_updates.new_global_entities.map(
            (entity) => entity.entity_address
          )

          addPoolComponent({
            address: createdEntities[0],
            poolUnit: createdEntities[1],
            resources: Object.values(resourceAddresses),
            transactions: [
              {
                transactionIntentHash:
                  response.transaction.intent_hash_hex || '',
                status: response.transaction.transaction_status,
              },
            ],
          })
        }
        setIsLoading(false)
        addLog(`transaction status: ${response.transaction.transaction_status}`)
      })
      .mapErr((error) => {
        setIsLoading(false)
        addLog(JSON.stringify(error, null, 2))
      })
  }

  const updatePoolType = (numberOfResources: number) => {
    if (numberOfResources === 1) {
      setPoolType('OneResourcePool')
    } else if (numberOfResources === 2) {
      setPoolType('TwoResourcePool')
    } else {
      setPoolType('MultiResourcePool')
    }
  }

  const updateResourceAddress = (value: string, index: number) => {
    setResourceAddresses({
      ...resourceAddresses,
      [index]: value,
    })
  }
  return (
    <Card
      title="Create Pool"
      side={
        <Stack direction="row" spacing={1}>
          <Chip color="success" size="lg" variant="solid">
            <strong>{poolType.slice(0, -4)}</strong>
          </Chip>
          <Button
            disabled={isLoading}
            onClick={() => {
              updatePoolType(Object.entries(resourceAddresses).length + 1)
              setResourceAddresses({
                ...resourceAddresses,
                [Object.keys(resourceAddresses).length]: '',
              })
            }}
          >
            Add
          </Button>
          <Button
            disabled={
              Object.entries(resourceAddresses).length === 1 || isLoading
            }
            color="warning"
            onClick={() => {
              updatePoolType(Object.entries(resourceAddresses).length - 1)
              setResourceAddresses(
                Object.fromEntries(
                  Object.entries(resourceAddresses).slice(0, -1)
                )
              )
            }}
          >
            Remove
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2}>
        {Object.values(resourceAddresses).map((address, index) => {
          return (
            <FormControl key={index + 1}>
              <FormLabel>Resource #{index + 1}</FormLabel>

              <Input
                type="string"
                required
                disabled={isLoading}
                value={address}
                onChange={(ev) => {
                  updateResourceAddress(ev.target.value, index)
                }}
                endDecorator={
                  <React.Fragment>
                    <Divider orientation="vertical" />
                    <FormControl>
                      <Select
                        disabled={isLoading}
                        variant="plain"
                        placeholder="Select from predefined"
                        onChange={(_, value: any) => {
                          updateResourceAddress(value || '', index)
                        }}
                        slotProps={{
                          listbox: {
                            variant: 'outlined',
                          },
                        }}
                        sx={{ mr: -1.5, '&:hover': { bgcolor: 'transparent' } }}
                      >
                        <Option value={xrdAddress}>XRD</Option>
                        {Object.entries(entities.fungibleToken)
                          .filter(([key]) => key !== xrdAddress)
                          .map(([key, value]) => {
                            return (
                              <Option value={key} key={key}>
                                {value.displayLabel}
                              </Option>
                            )
                          })}
                      </Select>
                    </FormControl>
                  </React.Fragment>
                }
              />
            </FormControl>
          )
        })}

        <Button
          onClick={instantiatePool}
          disabled={
            Object.values(resourceAddresses).some((address) => !address) ||
            isLoading
          }
        >
          {isLoading ? 'waiting for response...' : 'Send TX'}
        </Button>
      </Stack>
    </Card>
  )
}
