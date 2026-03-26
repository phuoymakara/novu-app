import { db } from '../../db'
import { tasks } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { ids } = await readBody(event) as { ids: number[] }

  for (let i = 0; i < ids.length; i++) {
    db.update(tasks)
      .set({ position: i })
      .where(and(eq(tasks.id, ids[i]), eq(tasks.userId, session.user.id)))
      .run()
  }

  return { ok: true }
})
