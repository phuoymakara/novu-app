import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium'),
  status: text('status', { enum: ['todo', 'in_progress', 'done'] }).default('todo'),
  dueDate: text('due_date'),
  remindAt: text('remind_at'), // ISO datetime string
  position: integer('position').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const taskReminders = sqliteTable('task_reminders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['early_morning', 'before_15min', 'before_5min', 'on_time', 'evening_check'] }).notNull(),
  remindAt: text('remind_at').notNull(), // ISO datetime string
  sentAt: text('sent_at'), // null = not yet sent
})

export const habits = sqliteTable('habits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').default('i-lucide-check'),
  color: text('color').default('primary'),
  streak: integer('streak').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const habitLogs = sqliteTable('habit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  habitId: integer('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
})

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').default(''),
  date: text('date').notNull(), // YYYY-MM-DD
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
