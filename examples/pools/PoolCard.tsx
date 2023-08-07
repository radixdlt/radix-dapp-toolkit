import * as React from 'react'
import { Card } from '../components/Card'
import { Clipboard } from '../components/Clipboard'

import {
  InstantiatedPool,
  rememberPoolTransaction,
  removePoolComponent,
} from './state'
import {
  Button,
  Divider,
  FormControl,
  FormLabel,
  Input,
  List,
  ListItem,
  Modal,
  ModalClose,
  Sheet,
  Stack,
  Tooltip,
  Typography,
} from '@mui/joy'
import { contributeToPoolManifest } from './manifests'
import { useEntities } from '../entity/state'
import { useState } from 'react'
import { SelectAccount } from '../account/SelectAccount'
import { rdt } from '../rdt/rdt'
import { shortenAddress } from '../helpers/shorten-address'
import { InfoBox } from '../components/InfoBox'
import { StandardMetadata } from '../standard-metadata/StandardMetadata'
export const PoolCard = ({ pool }: { pool: InstantiatedPool }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState<boolean>(false)
  const [account, setAccount] = useState<string>('')
  const [contributions, setContributiones] = useState<
    Record<
      string,
      {
        amount: string
        accountToWithdrawFrom: string
      }
    >
  >(
    pool.resources.reduce((acc, resource) => {
      acc[resource] = {
        amount: '0',
        accountToWithdrawFrom: '',
      }
      return acc
    }, {})
  )
  const { fungibleToken } = useEntities()

  const contribute = () => {
    setIsLoading(true)
    const transactionManifest = contributeToPoolManifest(
      account,
      pool.address,
      Object.entries(contributions).map(([resourceAddress, value]) => ({
        resourceAddress,
        amount: value.amount,
        accountToWithdrawFrom: value.accountToWithdrawFrom || account,
      }))
    )
    rdt.walletApi
      .sendTransaction({
        transactionManifest,
        version: 1,
      })
      .map((result) => {
        rememberPoolTransaction(pool.address, result)
        setIsLoading(false)
      })
      .mapErr((result) => setIsLoading(false))
  }
  return (
    <>
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: 500,
            borderRadius: 'md',
            p: 3,
            boxShadow: 'lg',
          }}
        >
          <ModalClose
            variant="outlined"
            sx={{
              top: 'calc(-1/4 * var(--IconButton-size))',
              right: 'calc(-1/4 * var(--IconButton-size))',
              boxShadow: '0 2px 12px 0 rgba(0 0 0 / 0.2)',
              borderRadius: '50%',
              bgcolor: 'background.surface',
            }}
          />
          <Typography
            component="h2"
            id="modal-title"
            level="h4"
            textColor="inherit"
            fontWeight="lg"
            mb={1}
          >
            Transactions History
          </Typography>
          <List>
            {pool.transactions.map((transaction) => {
              return (
                <ListItem key={transaction.transactionIntentHash}>
                  {shortenAddress(transaction.transactionIntentHash)}
                  <Clipboard
                    textToCopy={transaction.transactionIntentHash}
                  ></Clipboard>
                </ListItem>
              )
            })}
          </List>
        </Sheet>
      </Modal>
      <Modal
        open={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: 800,
            minWidth: 500,
            borderRadius: 'md',
            p: 3,
            boxShadow: 'lg',
          }}
        >
          <ModalClose
            variant="outlined"
            sx={{
              top: 'calc(-1/4 * var(--IconButton-size))',
              right: 'calc(-1/4 * var(--IconButton-size))',
              boxShadow: '0 2px 12px 0 rgba(0 0 0 / 0.2)',
              borderRadius: '50%',
              bgcolor: 'background.surface',
            }}
          />
          <Typography
            component="h2"
            id="modal-title"
            level="h4"
            textColor="inherit"
            fontWeight="lg"
            mb={1}
          >
            Pool Unit Metadata
          </Typography>
          <StandardMetadata
            address={pool.poolUnit}
            type="fungible"
          ></StandardMetadata>
        </Sheet>
      </Modal>
      <Card
        title={shortenAddress(pool.address)}
        side={
          <Stack direction="row" spacing={2}>
            <Clipboard textToCopy={pool.address}></Clipboard>
            <Button color="neutral" onClick={() => setIsModalOpen(true)}>
              Transactions
            </Button>
            <Button color="warning" onClick={() => removePoolComponent(pool)}>
              Remove
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <InfoBox label="Pool Unit" address={pool.poolUnit}></InfoBox>
            <Button
              color="neutral"
              onClick={() => setIsMetadataModalOpen(true)}
            >
              Set Metadata
            </Button>
          </Stack>

          <Divider></Divider>
          <SelectAccount
            label="Pool Unit Deposition Account"
            onChange={(value) => {
              setContributiones({
                ...contributions,
              })
              setAccount(value)
            }}
          ></SelectAccount>

          {pool.resources.map((resource, index) => {
            return (
              <FormControl key={resource + index}>
                <FormLabel>
                  {fungibleToken[resource]
                    ? fungibleToken[resource].displayLabel
                    : 'Unknown Token'}{' '}
                  Amount ({shortenAddress(resource)})
                </FormLabel>
                <Input
                  value={contributions[resource].amount}
                  type="number"
                  required
                  disabled={isLoading}
                  onChange={(ev) => {
                    setContributiones({
                      ...contributions,
                      [resource]: {
                        ...contributions[resource],
                        amount: ev.target.value,
                      },
                    })
                  }}
                  endDecorator={
                    <React.Fragment>
                      <Divider orientation="vertical" />

                      <SelectAccount
                        variant="plain"
                        sx={{
                          mr: -1.5,
                          '&:hover': { bgcolor: 'transparent' },
                        }}
                        value={contributions[resource].accountToWithdrawFrom}
                        placeholder="Withdraw from..."
                        onChange={(value) => {
                          setContributiones({
                            ...contributions,
                            [resource]: {
                              ...contributions[resource],
                              accountToWithdrawFrom: value,
                            },
                          })
                        }}
                      ></SelectAccount>
                    </React.Fragment>
                  }
                />
              </FormControl>
            )
          })}
          <Button fullWidth onClick={contribute} disabled={isLoading}>
            Contribute to pool
          </Button>
        </Stack>
      </Card>
    </>
  )
}
