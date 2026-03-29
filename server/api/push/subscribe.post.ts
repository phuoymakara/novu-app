import { db } from '../../db'
import { pushSubscriptions } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { endpoint, keys } = await readBody(event)
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw createError({ statusCode: 400, message: 'Invalid subscription data' })
  }

  console.log('[Push] Subscribe called — userId:', session.user.id, 'endpoint:', endpoint.slice(0, 60))

  // Replace any existing subscription for this endpoint
  db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint)).run()
  db.insert(pushSubscriptions).values({
    userId: session.user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  }).run()

  const saved = db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, session.user.id)).all()
  console.log('[Push] Subscriptions saved for user', session.user.id, '→', saved.length, 'device(s)')

  return { ok: true }
})
