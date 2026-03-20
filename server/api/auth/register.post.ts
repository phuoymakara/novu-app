import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { hash } from 'ohash'

export default defineEventHandler(async (event) => {
  const { email, name, password } = await readBody(event)

  if (!email || !name || !password) {
    throw createError({ statusCode: 400, message: 'All fields are required' })
  }

  const existing = db.select().from(users).where(eq(users.email, email)).get()
  if (existing) {
    throw createError({ statusCode: 409, message: 'Email already registered' })
  }

  const hashedPassword = hash(password)
  const [user] = db.insert(users).values({ email, name, password: hashedPassword }).returning({
    id: users.id,
    email: users.email,
    name: users.name,
  }).all()

  await setUserSession(event, { user })
  return user
})
