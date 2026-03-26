import { copyFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'

const DB_FILE = 'sqlite.db'
const BACKUP_DIR = 'backups'
const KEEP_LAST = 10

if (!existsSync(DB_FILE)) {
  console.log('[backup] No sqlite.db found, skipping backup.')
  process.exit(0)
}

mkdirSync(BACKUP_DIR, { recursive: true })

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const dest = join(BACKUP_DIR, `sqlite-${timestamp}.db`)

copyFileSync(DB_FILE, dest)
console.log(`[backup] Saved → ${dest}`)

// Prune old backups, keep the most recent KEEP_LAST
const backups = readdirSync(BACKUP_DIR)
  .filter(f => f.startsWith('sqlite-') && f.endsWith('.db'))
  .sort()

if (backups.length > KEEP_LAST) {
  const toDelete = backups.slice(0, backups.length - KEEP_LAST)
  for (const f of toDelete) {
    unlinkSync(join(BACKUP_DIR, f))
    console.log(`[backup] Pruned old backup: ${f}`)
  }
}
