import * as React from 'react'
import { RdtProvider } from './rdt/RdtProvider'
import { rdt } from './rdt/rdt'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { router } from './router'

export const DApp = () => {
  return (
    <RdtProvider value={rdt}>
      <RouterProvider router={router} />
    </RdtProvider>
  )
}
