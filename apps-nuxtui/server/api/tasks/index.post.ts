import { db } from '../../db'
import { tasks } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  if (!body.title) throw createError({ statusCode: 400, message: 'Title is required' })

  const [task] = db.insert(tasks).values({
    userId: session.user.id,
    title: body.title,
    description: body.description,
    priority: body.priority ?? 'medium',
    status: body.status ?? 'todo',
    dueDate: body.dueDate,
  }).returning().all()

  return task
})
