import webpush from 'web-push'
import { db } from '../db'
import { taskReminders, tasks, pushSubscriptions } from '../db/schema'
import { eq, lte, isNull, and } from 'drizzle-orm'
import { REMINDER_MESSAGES, type ReminderType } from '../utils/reminder-schedule'

let vapidReady = false

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
    // Mark evening_check as sent if task is already done
    if (reminder.type === 'evening_check' && task.status === 'done') {
      db.update(taskReminders).set({ sentAt: now }).where(eq(taskReminders.id, reminder.id)).run()
      continue
    }

    // Skip push if VAPID not configured — still mark as processed so it doesn't pile up
    if (!vapidReady) {
      console.warn(`[Reminders] Skipping push for task #${task.id} — VAPID not configured`)
      continue
    }

    const subs = db.select().from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, reminder.userId)).all()

    const msg = REMINDER_MESSAGES[reminder.type as ReminderType](task.title)

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: msg.title, body: msg.body, url: '/tasks' }),
        )
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    console.log(`[Reminders] Sent "${reminder.type}" for task #${task.id} → ${sent}/${subs.length} devices`)

    db.update(taskReminders).set({ sentAt: now }).where(eq(taskReminders.id, reminder.id)).run()
  }
}

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()

  if (config.vapidPrivateKey && config.public.vapidPublicKey) {
    webpush.setVapidDetails(
      config.vapidEmail,
      config.public.vapidPublicKey,
      config.vapidPrivateKey,
    )
    vapidReady = true
    console.log('[Reminders] VAPID configured — push notifications enabled')
  }
  else {
    console.warn('[Reminders] VAPID keys not set — reminders will run but push is disabled')
    console.warn('[Reminders] Run "yarn gen:vapid" and add keys to .env to enable push')
  }

  // Cron always starts regardless of VAPID
  setInterval(() => checkAndSendReminders(), 60 * 1000)
  console.log('[Reminders] Cron started — checking every minute')
})
