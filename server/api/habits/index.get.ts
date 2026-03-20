import { db } from '../../db'
import { habits, habitLogs } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const today = new Date().toISOString().slice(0, 10)

  const userHabits = db.select().from(habits)
    .where(eq(habits.userId, session.user.id))
    .all()

  const todayLogs = db.select().from(habitLogs)
    .where(eq(habitLogs.date, today))
    .all()

  const loggedHabitIds = new Set(todayLogs.map(l => l.habitId))

  return userHabits.map(h => ({
    ...h,
    completedToday: loggedHabitIds.has(h.id),
  }))
})
