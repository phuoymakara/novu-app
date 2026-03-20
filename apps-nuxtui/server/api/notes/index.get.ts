import { db } from '../../db'
import { notes } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  return db.select().from(notes)
    .where(eq(notes.userId, session.user.id))
    .orderBy(desc(notes.updatedAt))
    .all()
})
