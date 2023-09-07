import * as React from 'react'
import { Code } from './Code'

export const useLogger = () => {
  const [state, setState] = React.useState<{
    address?: string
    logs: string[]
  }>({ logs: [] })

  const addLog = (log: string) =>
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${log}`],
    }))

  return {
    Logger: state.logs.length ? (
      <Code>{state.logs.reverse().join('\n')}</Code>
    ) : null,
    addLog,
    reset: () => setState({ logs: [] }),
  }
}
