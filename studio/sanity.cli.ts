import { defineCliConfig } from 'sanity/cli'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET

export default defineCliConfig({
  api: { projectId, dataset },
  deployment: {
    appId: 'qh6ne91098el05wsv3kqwrhq',
  },
})
