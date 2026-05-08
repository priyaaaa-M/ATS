import { desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { notifications } from '../db/schema'

export const dashboardService = {
  getActivity: async (userId: string) =>
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(10),
}
