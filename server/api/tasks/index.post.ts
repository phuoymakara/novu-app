import { db } from '../../db'
import { tasks, taskReminders } from '../../db/schema'
import { generateReminderRows } from '../../utils/reminder-schedule'

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
    remindAt: body.remindAt || null,
  }).returning().all()

  if (body.remindAt) {
    const rows = generateReminderRows(task.id, session.user.id, new Date(body.remindAt))
    for (const row of rows) {
      db.insert(taskReminders).values(row).run()
    }
  }

  return task
})
