import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Page } from './layouts/Page'
import { DataRequestsPage } from './data-request/DataRequestsPage'
import { CreateTokenPage } from './create-token/CreateTokenPage'
import { IntegrationTestsPage } from './integration-tests/IntegrationTestsPage'
import { SettingsPage } from './settings/SettingsPage'
import { SendTransactionPage } from './send-transaction/SendTransactionPage'
import { RolaPage } from './rola/RolaPage'
import { OneTimeDataRequestsPage } from './one-time-data-request/OneTimeDataRequestsPage'
import { PoolsPage } from './pools/PoolsPage'
import { StandardMetadataPage } from './standard-metadata/StandardMetadataPage'
import { IS_PUBLIC } from './config'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Page />,
    children: [
      {
        index: true,
        element: <Navigate to="/data-request" replace />,
        hidePublic: false,
      },
      {
        path: 'data-request',
        element: <DataRequestsPage />,
        hidePublic: false,
      },
      {
        path: 'one-time-data-request',
        element: <OneTimeDataRequestsPage />,
        hidePublic: false,
      },
      {
        path: 'create-token',
        element: <CreateTokenPage />,
        hidePublic: true,
      },
      {
        path: 'integration-tests',
        element: <IntegrationTestsPage />,
        hidePublic: true,
      },
      {
        path: 'standard-metadata',
        element: <StandardMetadataPage />,
        hidePublic: true,
      },
      {
        path: 'send-transaction',
        element: <SendTransactionPage />,
        hidePublic: true,
      },
      {
        path: 'pools',
        element: <PoolsPage />,
        hidePublic: true,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
        hidePublic: false,
      },
      {
        path: 'rola',
        element: <RolaPage />,
        hidePublic: true,
      },
    ]
      .filter((route) => {
        return !IS_PUBLIC || !route.hidePublic
      })
      .map(({ path, element }) => ({ path, element })),
  },
])
