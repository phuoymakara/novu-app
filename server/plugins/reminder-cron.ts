import webpush from 'web-push'
import { db } from '../db'
import { taskReminders, tasks, pushSubscriptions } from '../db/schema'
import { eq, lte, isNull, and } from 'drizzle-orm'
import { REMINDER_MESSAGES, type ReminderType } from '../utils/reminder-schedule'

async function checkAndSendReminders() {
  const now = new Date().toISOString()

  const due = db
    .select({ reminder: taskReminders, task: tasks })
    .from(taskReminders)
    .innerJoin(tasks, eq(taskReminders.taskId, tasks.id))
    .where(and(lte(taskReminders.remindAt, now), isNull(taskReminders.sentAt)))
    .all()

  if (!due.length) return

  for (const { reminder, task } of due) {
    if (reminder.type === 'evening_check' && task.status === 'done') {
      db.update(taskReminders).set({ sentAt: now }).where(eq(taskReminders.id, reminder.id)).run()
      continue
    }

    const subs = db.select().from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, reminder.userId)).all()

    const msg = REMINDER_MESSAGES[reminder.type as ReminderType](task.title)

    await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: msg.title, body: msg.body, url: '/tasks' }),
        )
      )
    )

    db.update(taskReminders).set({ sentAt: now }).where(eq(taskReminders.id, reminder.id)).run()
  }
}

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()

  if (!config.vapidPrivateKey || !config.public.vapidPublicKey) {
    console.warn('[Reminders] VAPID keys not set — reminder cron disabled')
    return
  }

  webpush.setVapidDetails(
    config.vapidEmail,
    config.public.vapidPublicKey,
    config.vapidPrivateKey,
  )

  // Run every 60 seconds using built-in setInterval (no external dependencies)
  setInterval(() => checkAndSendReminders(), 60 * 1000)

  console.log('[Reminders] Cron started — checking every minute')
})
