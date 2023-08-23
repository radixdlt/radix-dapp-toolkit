import * as React from 'react'
import { CreatePoolCard } from './CreatePoolCard'
import { usePoolsState } from './state'
import { PoolCard } from './PoolCard'
import { Grid } from '@mui/joy'

export const PoolsPage = () => {
  const pools = usePoolsState()
  return (
    <Grid container spacing={2}>
      <Grid xs={12} lg={6} xl={4}>
        <CreatePoolCard></CreatePoolCard>
      </Grid>

      {Object.values(pools).map((pool) => (
        <Grid xs={12} lg={6} xl={4} key={pool.address}>
          <PoolCard pool={pool}></PoolCard>
        </Grid>
      ))}
    </Grid>
  )
}
