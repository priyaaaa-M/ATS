import cron from 'node-cron'
import { and, eq, gt, lt } from 'drizzle-orm'
import { DateTime } from 'luxon'
import { config } from '../config'
import { db } from '../db'
import { scheduledInterviews } from '../db/schema'
import { readaiService } from '../services/readai.service'

async function checkPendingTranscripts() {
  console.log('[TRANSCRIPT JOB] Checking pending transcripts...')

  const now = new Date()
  const cutoff = DateTime.now()
    .minus({ hours: config.jobs.transcriptFetchLookbackHours })
    .toJSDate()

  const pending = await db
    .select()
    .from(scheduledInterviews)
    .where(
      and(
        eq(scheduledInterviews.transcriptReceived, false),
        eq(scheduledInterviews.status, 'scheduled'),
        lt(scheduledInterviews.scheduledEndTime, now),
        gt(scheduledInterviews.scheduledEndTime, cutoff)
      )
    )

  for (const interview of pending) {
    const tryAfter = DateTime.fromJSDate(interview.scheduledEndTime).plus({
      minutes: config.jobs.transcriptFetchDelayMinutes,
    })

    if (DateTime.now() < tryAfter) {
      continue
    }

    await readaiService.fetchTranscriptForInterview(interview.id).catch((err) => {
      console.error(`[TRANSCRIPT JOB] Failed for ${interview.id}:`, err)
    })

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

export function startTranscriptJob() {
  cron.schedule(config.jobs.transcriptCron, checkPendingTranscripts)
  console.log('[TRANSCRIPT JOB] Started')
}
