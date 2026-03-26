import { copyFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const DB_FILE = 'sqlite.db'
const BACKUP_DIR = 'backups'

if (!existsSync(BACKUP_DIR)) {
  console.error('[rollback] No backups directory found.')
  process.exit(1)
}

const backups = readdirSync(BACKUP_DIR)
  .filter(f => f.startsWith('sqlite-') && f.endsWith('.db'))
  .sort()

if (!backups.length) {
  console.error('[rollback] No backups found.')
  process.exit(1)
}

// Use argument if provided, otherwise pick latest
const target = process.argv[2] ?? backups[backups.length - 1]
const src = join(BACKUP_DIR, target)

if (!existsSync(src)) {
  console.error(`[rollback] Backup not found: ${target}`)
  console.log('\nAvailable backups:')
  backups.forEach((f, i) => console.log(`  ${i === backups.length - 1 ? '→' : ' '} ${f}`))
  process.exit(1)
}

// Backup current db before overwriting
if (existsSync(DB_FILE)) {
  const safetyStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const safetyCopy = join(BACKUP_DIR, `sqlite-pre-rollback-${safetyStamp}.db`)
  copyFileSync(DB_FILE, safetyCopy)
  console.log(`[rollback] Current db saved as safety copy → ${safetyCopy}`)
}

copyFileSync(src, DB_FILE)
console.log(`[rollback] Restored ← ${src}`)
