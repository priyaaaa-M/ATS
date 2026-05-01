import { createApp } from './src/app'
import { config } from './src/config'
import { startTranscriptJob } from './src/jobs/transcript.job'

const app = createApp()
const dbUrl = new URL(config.supabase.dbUrl)

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`)
  console.log(`Environment: ${config.nodeEnv}`)
  console.log(`App URL: ${config.appBaseUrl}`)
  console.log(`DB Host: ${dbUrl.hostname}:${dbUrl.port || '5432'}`)
  startTranscriptJob()
})
