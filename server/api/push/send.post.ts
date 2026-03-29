import webpush from 'web-push'
import { db } from '../../db'
import { pushSubscriptions } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const config = useRuntimeConfig()
  if (!config.vapidPublicKey || !config.vapidPrivateKey) {
    throw createError({ statusCode: 500, message: 'VAPID keys not configured' })
  }

  webpush.setVapidDetails(
    config.vapidEmail,
    config.public.vapidPublicKey,
    config.vapidPrivateKey,
  )

  const { title, body, url } = await readBody(event)

  const subs = db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, session.user.id)).all()

  if (!subs.length) return { sent: 0 }

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: title || 'DailyOS', body: body || '', url: url || '/' }),
      )
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return { sent }
})
