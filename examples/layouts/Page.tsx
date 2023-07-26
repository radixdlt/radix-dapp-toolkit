import * as React from 'react'
import { CssVarsProvider } from '@mui/joy/styles'
import CssBaseline from '@mui/joy/CssBaseline'
import teamTheme from '../theme'
import Layout from '../components/Layout'
import { Header } from '../layouts/Header'
import { Sidebar } from '../layouts/Sidebar'
import { Logger } from '../logger/Logger'
import { Outlet } from 'react-router-dom'

export const Page = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  return (
    <CssVarsProvider disableTransitionOnChange theme={teamTheme}>
      <CssBaseline />
      {drawerOpen && (
        <Layout.SideDrawer onClose={() => setDrawerOpen(false)}>
          <Sidebar />
        </Layout.SideDrawer>
      )}
      <Layout.Root
        sx={{
          ...(drawerOpen && {
            height: '100vh',
            overflow: 'hidden',
          }),
        }}
      >
        <Header setDrawerOpen={(value) => setDrawerOpen(value)} />

        <Layout.SideNav>
          <Sidebar />
        </Layout.SideNav>

        <Layout.Main>
          <Outlet />
          <Logger />
        </Layout.Main>
      </Layout.Root>
    </CssVarsProvider>
  )
}
