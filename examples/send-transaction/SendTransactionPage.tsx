import { Box, Button, Input, Sheet, Textarea, Typography } from '@mui/joy'
import * as React from 'react'
import { Card } from '../components/Card'
import { useRdt } from '../rdt/hooks/useRdt'
import { addItemToTransactionHistory, useTransactionHistory } from './state'
import { Code } from '../components/Code'

export const SendTransactionPage = () => {
  const [{ message, transactionManifest, loading }, setState] = React.useState({
    message: '',
    transactionManifest: '',
    loading: false,
  })
  const rdt = useRdt()
  const transactionHistory = useTransactionHistory()
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'minmax(300px, 1fr)',
          md: 'repeat(2, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      <Card title="History">
        {transactionHistory.map((item, index) => (
          <Box key={item.id} sx={{ mb: 2 }}>
            <Sheet
              sx={{
                borderRadius: 'sm',
              }}
            >
              <Box
                sx={{
                  height: '100px',
                  overflow: 'auto',
                  position: 'relative',
                }}
                onClick={() => {
                  setState({
                    transactionManifest: item.transactionManifest,
                    message: item.message,
                    loading: false,
                  })
                }}
              >
                <Code>{item.transactionManifest}</Code>
              </Box>
            </Sheet>
          </Box>
        ))}
      </Card>
      <Card
        title="Transaction"
        side={
          <Button
            disabled={loading}
            onClick={() => {
              addItemToTransactionHistory({ transactionManifest, message })
              setState((prev) => ({ ...prev, loading: true }))
              rdt
                .sendTransaction({ transactionManifest, version: 1, message })
                .map(() => {
                  setState(() => ({
                    message: '',
                    transactionManifest: '',
                    loading: false,
                  }))
                })
                .mapErr(() => {
                  setState((prev) => ({ ...prev, loading: false }))
                })
            }}
          >
            Send Transaction
          </Button>
        }
      >
        <Input
          placeholder="Message"
          value={message}
          onChange={(e) =>
            setState((prev) => ({ ...prev, message: e.target.value }))
          }
          sx={{ mb: 2 }}
        />
        <Textarea
          placeholder="Transaction Manifest"
          value={transactionManifest}
          minRows={10}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              transactionManifest: e.target.value,
            }))
          }
        />
      </Card>
    </Box>
  )
}
