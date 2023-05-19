import React from 'react'
import { Button } from '@mui/joy'

export const Clipboard = ({textToCopy}: {textToCopy: string}) => {
  const copy = () => {
    navigator.clipboard.writeText(textToCopy);
  }
  return <Button onClick={copy} size="sm" variant="plain">copy</Button>
}
