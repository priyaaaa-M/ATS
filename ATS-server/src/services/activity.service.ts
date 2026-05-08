import { db } from '../db'
import { notifications } from '../db/schema'

export const activityService = {
  logActivity: async (params: {
    userId: string
    type: string
    message: string
    candidateId?: string
    actorName?: string
    actorInitials?: string
  }) => {
    await db.insert(notifications).values({
      userId: params.userId,
      type: params.type,
      message: params.message,
      isRead: false,
      metadata: {
        candidateId: params.candidateId,
        actorName: params.actorName,
        actorInitials: params.actorInitials,
      },
    })
  },
}
