import '@fontsource/public-sans'
import React from 'react'
import { StyledEngineProvider } from '@mui/joy/styles'
import { DApp } from './DApp'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root')!)
root.render(
  <StyledEngineProvider injectFirst>
    <DApp />
  </StyledEngineProvider>
)
