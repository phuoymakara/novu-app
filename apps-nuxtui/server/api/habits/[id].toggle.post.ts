import { db } from '../../db'
import { habits, habitLogs } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = Number(getRouterParam(event, 'id'))
  const today = new Date().toISOString().slice(0, 10)

  const habit = db.select().from(habits)
    .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)))
    .get()

  if (!habit) throw createError({ statusCode: 404, message: 'Habit not found' })

  const existing = db.select().from(habitLogs)
    .where(and(eq(habitLogs.habitId, id), eq(habitLogs.date, today)))
    .get()

  if (existing) {
    // Un-complete: remove log and decrease streak
    db.delete(habitLogs).where(eq(habitLogs.id, existing.id)).run()
    db.update(habits).set({ streak: Math.max(0, (habit.streak ?? 0) - 1) })
      .where(eq(habits.id, id)).run()
    return { completedToday: false }
  }
  else {
    // Complete: add log and increase streak
    db.insert(habitLogs).values({ habitId: id, date: today }).run()
    db.update(habits).set({ streak: (habit.streak ?? 0) + 1 })
      .where(eq(habits.id, id)).run()
    return { completedToday: true }
  }
})
