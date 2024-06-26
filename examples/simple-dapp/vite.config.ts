import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import { ngrok } from 'vite-plugin-ngrok'

fs.writeFileSync(
  path.resolve(__dirname, 'public', '.well-known', 'radix.json'),
  JSON.stringify(
    {
      callbackPath: process.env.VITE_RETURN_URL,
      dApps: [
        {
          dAppDefinitionAddress: process.env.DAPP_DEFINITION_ADDRESS,
        },
      ],
    },
    null,
    2,
  ),
)

const plugins = []

if (process.env.NGROK_AUTH_TOKEN)
  // @ts-ignore
  plugins.push(ngrok(process.env.NGROK_AUTH_TOKEN))

export default defineConfig({
  plugins,
})
