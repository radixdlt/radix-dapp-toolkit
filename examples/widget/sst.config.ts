import type { SSTConfig } from 'sst'
import { StaticSite } from 'sst/constructs'

import { exec } from 'child_process'

const getBranchName = () =>
  new Promise<string>((resolve, reject) => {
    exec('git branch --show-current', (err, stdout) => {
      if (err) {
        reject(err)
      } else {
        const branchName = stdout.trim().split('/').slice(-1)[0]
        resolve(branchName)
      }
    })
  })

const branchName = await getBranchName()

export default {
  config() {
    return {
      name: `widget-${branchName}`,
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
