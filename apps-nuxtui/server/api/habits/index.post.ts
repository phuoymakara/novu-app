import { db } from '../../db'
import { habits } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  if (!body.name) throw createError({ statusCode: 400, message: 'Name is required' })

  const [habit] = db.insert(habits).values({
    userId: session.user.id,
    name: body.name,
    icon: body.icon ?? 'i-lucide-check',
    color: body.color ?? 'primary',
  }).returning().all()

  return habit
})
