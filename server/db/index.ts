import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { resolve } from 'path'
import * as schema from './schema'

const dbPath = process.env.DATABASE_PATH || resolve(process.cwd(), 'sqlite.db')
const sqlite = new Database(dbPath)

sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

// Run migrations on startup
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done')),
    due_date TEXT,
    position INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'i-lucide-check',
    color TEXT DEFAULT 'primary',
    streak INTEGER DEFAULT 0,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    date TEXT NOT NULL,
    created_at INTEGER,
    updated_at INTEGER
  );
`)

// Add position column to existing DBs (no-op if already exists)
try { sqlite.exec('ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0') } catch {}
try { sqlite.exec('ALTER TABLE tasks ADD COLUMN remind_at TEXT') } catch {}

// Migrate task_reminders: drop CHECK constraint if it's missing newer types
const reminderTableSql = (sqlite.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='task_reminders'`).get() as { sql: string } | undefined)?.sql ?? ''
if (reminderTableSql.includes('CHECK')) {
  sqlite.exec(`
    CREATE TABLE task_reminders_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      remind_at TEXT NOT NULL,
      sent_at TEXT
    );
    INSERT INTO task_reminders_new SELECT id, task_id, user_id, type, remind_at, sent_at FROM task_reminders;
    DROP TABLE task_reminders;
    ALTER TABLE task_reminders_new RENAME TO task_reminders;
  `)
} else {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS task_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      remind_at TEXT NOT NULL,
      sent_at TEXT
    );
  `)
}

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at INTEGER
  );
`)
