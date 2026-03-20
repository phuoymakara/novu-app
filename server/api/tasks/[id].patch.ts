import { db } from '../../db'
import { tasks } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const [task] = db.update(tasks)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))
    .returning()
    .all()

  if (!task) throw createError({ statusCode: 404, message: 'Task not found' })
  return task
})
