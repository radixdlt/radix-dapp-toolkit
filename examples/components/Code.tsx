import * as React from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { monokaiSublime } from 'react-syntax-highlighter/dist/esm/styles/hljs'

export const Code = ({ children }: React.PropsWithChildren<{}>) => (
  <SyntaxHighlighter language="javascript" style={monokaiSublime}>
    {children}
  </SyntaxHighlighter>
)
