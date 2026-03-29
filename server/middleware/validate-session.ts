import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Only check authenticated API routes, skip auth endpoints
  if (!path.startsWith('/api/') || path.startsWith('/api/auth/')) return

  const session = await getUserSession(event)
  if (!session.user) return

  const user = db.select({ id: users.id }).from(users).where(eq(users.id, session.user.id)).get()
  if (!user) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, message: 'Session expired, please log in again' })
  }
})
