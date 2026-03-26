# DailyOS

A full-stack personal productivity app for managing tasks, building habits, and journaling — built with Nuxt 4, Nuxt UI, and SQLite.

## Features

- **Tasks** — Create, update, and filter tasks by priority (low/medium/high) and status (todo/in_progress/done)
- **Habits** — Daily check-ins with streak tracking, custom icons, and color themes
- **Notes** — Date-based journaling with auto-save and a split-panel editor
- **Dashboard** — At-a-glance stats, habit progress, and recent tasks
- **Auth** — Registration, login, and session-based route protection
- **Themes** — 17 primary colors, 5 neutral palettes, and dark mode — all persisted to localStorage

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4 (SSR disabled) |
| UI | @nuxt/ui v3 + Tailwind CSS |
| State | Pinia |
| Utilities | VueUse |
| Server | Nitro (built into Nuxt 4) |
| Database | SQLite via better-sqlite3 |
| ORM | Drizzle ORM |
| Auth | nuxt-auth-utils |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production (copies SQLite DB to output) |
| `npm run start` | Start production server on port 3002 |
| `npm run generate` | Generate static site |
| `npm run preview` | Preview production build |

## Project Structure

```
apps-nuxtui/
├── app/
│   ├── components/       # Reusable UI components
│   ├── composables/      # useConfirm, useTheme
│   ├── layouts/          # Default layout with sidebar navigation
│   ├── middleware/        # Auth guard
│   ├── pages/            # index, login, register, tasks, habits, notes
│   └── stores/           # Pinia stores
├── server/
│   ├── api/
│   │   ├── auth/         # login, logout, register
│   │   ├── tasks/        # CRUD + status update
│   │   ├── habits/       # CRUD + daily toggle
│   │   └── notes/        # CRUD
│   └── db/
│       ├── schema.ts     # Drizzle schema (users, tasks, habits, habit_logs, notes)
│       └── index.ts      # DB init with WAL mode and auto-migration
├── nuxt.config.ts
├── app.config.ts         # Default color palette
└── sqlite.db             # SQLite database file
```

## Database Schema

- **users** — email, name, hashed password
- **tasks** — title, description, priority, status, due_date (cascade delete on user)
- **habits** — name, icon, color, streak (cascade delete on user)
- **habit_logs** — daily completion records per habit (YYYY-MM-DD)
- **notes** — title, content, date (cascade delete on user)

SQLite runs in WAL mode for improved concurrent read performance.
