import { db } from '../../db'
import { habits } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = Number(getRouterParam(event, 'id'))

  db.delete(habits)
    .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)))
    .run()

  return { success: true }
})
