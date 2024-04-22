import type { SSTConfig } from 'sst'
import { StaticSite } from 'sst/constructs'

export default {
  config() {
    return {
      name: 'simple-dapp',
      region: process.env.AWS_REGION,
      profile: process.env.AWS_PROFILE,
      stage: process.env.AWS_STAGE,
    }
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const site = new StaticSite(stack, 'site', {
        buildCommand: 'npm run build',
        buildOutput: 'dist',
      })

      stack.addOutputs({
        url: site.url,
      })
    })
  },
} satisfies SSTConfig
