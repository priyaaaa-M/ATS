import { desc, eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import { candidates, notifications, scheduledInterviews } from '../db/schema'
import { importBatchService } from './importBatch.service'

export const dashboardService = {
  getActivity: async (userId: string) =>
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(10),

  getActions: async (userId: string) => {
    const rows = await db
      .select()
      .from(candidates)
      .where(eq(candidates.userId, userId))

    const candidateIds = rows.map((candidate) => candidate.id)
    const interviews = candidateIds.length
      ? await db
          .select()
          .from(scheduledInterviews)
          .where(inArray(scheduledInterviews.candidateId, candidateIds))
      : []

    const importBatches = await importBatchService.listByUser(userId)
    const failedImports = importBatches.filter((batch) =>
      ['failed', 'completed_with_errors'].includes(batch.status)
    )

    return [
      {
        id: 'review',
        title: 'Candidates need HR review',
        description: 'Screen inbox resumes and approve strong matches.',
        count: rows.filter((candidate) => candidate.status === 'pending').length,
        href: '/candidates',
        tone: 'primary',
      },
      {
        id: 'booking',
        title: 'Interviews need slot booking',
        description: 'Approved candidates are waiting for interviewers to choose time.',
        count: rows.filter(
          (candidate) =>
            candidate.status === 'hr_approved' &&
            candidate.roundStatus === 'pending'
        ).length,
        href: '/candidates?status=pipeline',
        tone: 'warning',
      },
      {
        id: 'feedback',
        title: 'Scheduled interviews in motion',
        description: 'Track live interviews and follow up for feedback.',
        count: interviews.filter((interview) => interview.status === 'scheduled').length,
        href: '/interviews',
        tone: 'info',
      },
      {
        id: 'imports',
        title: 'Import batches need attention',
        description: 'Review failed or partially completed resume imports.',
        count: failedImports.length,
        href: '/dashboard',
        tone: 'danger',
      },
    ]
  },
}
