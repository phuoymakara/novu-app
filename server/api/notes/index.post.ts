import { db } from '../../db'
import { notes } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  if (!body.title) throw createError({ statusCode: 400, message: 'Title is required' })

  const today = new Date().toISOString().slice(0, 10)

  const [note] = db.insert(notes).values({
    userId: session.user.id,
    title: body.title,
    content: body.content ?? '',
    date: body.date ?? today,
  }).returning().all()

  return note
})
