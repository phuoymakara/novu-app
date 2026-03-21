import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user: googleUser }) {
    let user = db.select().from(users).where(eq(users.email, googleUser.email)).get()

    if (!user) {
      const [newUser] = db.insert(users).values({
        email: googleUser.email,
        name: googleUser.name,
        password: 'oauth:google',
      }).returning().all()
      user = newUser
    }

    await setUserSession(event, {
      user: { id: user.id, email: user.email, name: user.name },
    })

    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login')
  },
})
