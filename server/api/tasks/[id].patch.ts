import { db } from '../../db'
import { tasks, taskReminders } from '../../db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { generateReminderRows } from '../../utils/reminder-schedule'

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

  // Regenerate reminders whenever remindAt is explicitly included in the update
  if ('remindAt' in body) {
    db.delete(taskReminders)
      .where(and(eq(taskReminders.taskId, id), isNull(taskReminders.sentAt)))
      .run()

    if (body.remindAt) {
      const rows = generateReminderRows(id, session.user.id, new Date(body.remindAt))
      for (const row of rows) {
        db.insert(taskReminders).values(row).run()
      }
    }
  }

  return task
})
