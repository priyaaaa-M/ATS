import { createApp } from './src/app'
import { config } from './src/config'
import { startTranscriptJob } from './src/jobs/transcript.job'

const app = createApp()

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`)
  console.log(`Environment: ${config.nodeEnv}`)
  console.log(`App URL: ${config.appBaseUrl}`)
  startTranscriptJob()
})

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${config.port} is already in use. Stop the other ATS server process or set PORT to a free port in ATS-server/.env.`
    )
    process.exit(1)
  }

  throw error
})
