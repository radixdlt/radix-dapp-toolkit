import { gatewayApi } from '../rdt/rdt'
import { useEffect } from 'react'
import React from 'react'

export const useAccount = (accountAddress: string) => {
  const [state, useState] = React.useState<any>()

  useEffect(() => {
    gatewayApi
      .getEntityDetails(accountAddress)
      .map((accounts) => useState(accounts))
      .mapErr(() => useState(undefined))
  }, [accountAddress])

  return state
}
