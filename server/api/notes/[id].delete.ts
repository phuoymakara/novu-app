import { db } from '../../db'
import { notes } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = Number(getRouterParam(event, 'id'))

  db.delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
    .run()

  return { success: true }
})
