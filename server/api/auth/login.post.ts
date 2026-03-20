import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { hash } from 'ohash'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email and password are required' })
  }

  const user = db.select().from(users).where(eq(users.email, email)).get()
  if (!user || user.password !== hash(password)) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name },
  })

  return { id: user.id, email: user.email, name: user.name }
})
