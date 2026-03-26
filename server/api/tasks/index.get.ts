import { db } from '../../db'
import { tasks } from '../../db/schema'
import { eq, asc, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  return db.select().from(tasks)
    .where(eq(tasks.userId, session.user.id))
    .orderBy(asc(tasks.position), desc(tasks.createdAt))
    .all()
})
