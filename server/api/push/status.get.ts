import { db } from '../../db'
import { pushSubscriptions } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const config = useRuntimeConfig(event)
  const subs = db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, session.user.id)).all()

  return {
    userId: session.user.id,
    subscriptions: subs.length,
    vapidPublicKey: config.public.vapidPublicKey?.slice(0, 20) + '...',
    endpoints: subs.map(s => s.endpoint.slice(0, 60) + '...'),
  }
})
