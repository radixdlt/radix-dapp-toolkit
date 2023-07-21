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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Page />,
    children: [
      { index: true, element: <Navigate to="/data-request" replace /> },
      {
        path: 'data-request',
        element: <DataRequestsPage />,
      },
      {
        path: 'one-time-data-request',
        element: <OneTimeDataRequestsPage />,
      },
      {
        path: 'create-token',
        element: <CreateTokenPage />,
      },
      {
        path: 'integration-tests',
        element: <IntegrationTestsPage />,
      },
      {
        path: 'send-transaction',
        element: <SendTransactionPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'rola',
        element: <RolaPage />,
      },
    ],
  },
])
