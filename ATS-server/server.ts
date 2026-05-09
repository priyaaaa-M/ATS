import { createApp } from './src/app'
import { config } from './src/config'
import { startTranscriptJob } from './src/jobs/transcript.job'

const app = createApp()

function startServer(port: number, maxAttempts = 10, currentAttempt = 0) {
  if (currentAttempt >= maxAttempts) {
    console.error(`Could not find a free port after ${maxAttempts} attempts.`)
    process.exit(1)
  }

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`)
    console.log(`Environment: ${config.nodeEnv}`)
    console.log(`App URL: ${config.appBaseUrl}`)
    startTranscriptJob()
  })

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use. Trying port ${port + 1}...`)
      startServer(port + 1, maxAttempts, currentAttempt + 1)
    } else {
      throw error
    }
  })
}

startServer(Number(config.port))
