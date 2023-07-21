import * as React from 'react'
import Box from '@mui/joy/Box'
import Divider from '@mui/joy/Divider'
import Sheet from '@mui/joy/Sheet'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'
import { AccountsCard } from './AccountsCard'
import { PersonaDataCard } from './PersonaDataCard'
import { useDataRequestState } from './state'
import { Code } from '../components/Code'
import { rdt } from '../rdt/rdt'
import {
  DataRequestBuilder,
  OneTimeDataRequestBuilder,
  OneTimeDataRequestBuilderItem,
} from '../../src'

export const OneTimeDataRequestsPage = () => {
  const dataRequestState = useDataRequestState()

  const [state, setState] = React.useState<{
    accounts: {
      enabled: boolean
      data: {
        numberOfAccounts: {
          quantity: number
          quantifier: 'atLeast' | 'exactly'
        }
        withProof: boolean
      }
    }
    personaData: {
      enabled: boolean
      data: {
        fullName: boolean
        emailAddresses: boolean
        phoneNumbers: boolean
      }
    }
  }>({
    accounts: {
      enabled: true,
      data: {
        numberOfAccounts: { quantity: 1, quantifier: 'atLeast' },
        withProof: false,
      },
    },
    personaData: {
      enabled: false,
      data: {
        fullName: false,
        emailAddresses: false,
        phoneNumbers: false,
      },
    },
  })

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(160px, 300px) minmax(200px, 1fr)',
        gap: 1,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gap: 1,
        }}
      >
        <AccountsCard
          state={state.accounts}
          updateState={(accountsState) => {
            setState((prev) => ({ ...prev, accounts: accountsState }))
          }}
        />
        <PersonaDataCard
          state={state.personaData}
          updateState={(personaDataState) => {
            setState((prev) => ({ ...prev, personaData: personaDataState }))
          }}
        />
      </Box>
      <Box>
        <Sheet
          variant="outlined"
          sx={{
            borderRadius: 'sm',
            p: 2,
            mb: 2,
            height: '100%',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ alignSelf: 'center' }} level="h6">
                One Time Data Request
              </Typography>
              <Button
                onClick={() => {
                  const dataRequest: OneTimeDataRequestBuilderItem[] = []
                  if (state.accounts.enabled) {
                    const accountsRequest = OneTimeDataRequestBuilder.accounts()
                    accountsRequest[
                      state.accounts.data.numberOfAccounts.quantifier
                    ](state.accounts.data.numberOfAccounts.quantity)
                    accountsRequest.withProof(state.accounts.data.withProof)

                    dataRequest.push(accountsRequest)
                  }

                  if (state.personaData.enabled) {
                    const personaDataRequest =
                      OneTimeDataRequestBuilder.personaData()

                    if (state.personaData.data.fullName) {
                      personaDataRequest.fullName()
                    }

                    if (state.personaData.data.emailAddresses) {
                      personaDataRequest.emailAddresses()
                    }

                    if (state.personaData.data.phoneNumbers) {
                      personaDataRequest.phoneNumbers()
                    }

                    dataRequest.push(personaDataRequest)
                  }

                  rdt.walletApi.sendOneTimeRequest(...dataRequest)
                }}
                sx={{ alignSelf: 'center', width: '150px' }}
              >
                Send request
              </Button>
            </Box>

            <Divider sx={{ mb: 2, mt: 2 }} />

            <Code>{JSON.stringify(state, null, 2)}</Code>
          </Box>
        </Sheet>
      </Box>
    </Box>
  )
}
