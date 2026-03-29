export type ReminderType = 'early_morning' | 'before_15min' | 'before_5min' | 'on_time' | 'evening_check'

interface ReminderConfig {
  type: ReminderType
  label: string
  getTime: (remindAt: Date) => Date
}

//  Global reminder schedule config 
// Edit here to change when reminders fire for every task.
export const REMINDER_CONFIG: ReminderConfig[] = [
  {
    type: 'early_morning',
    label: 'Early morning (8:00 AM)',
    getTime: (remindAt) => {
      const d = new Date(remindAt)
      d.setHours(8, 0, 0, 0)
      return d
    },
  },
  {
    type: 'before_15min',
    label: '15 minutes before',
    getTime: (remindAt) => new Date(remindAt.getTime() - 15 * 60 * 1000),
  },
  {
    type: 'before_5min',
    label: '5 minutes before',
    getTime: (remindAt) => new Date(remindAt.getTime() - 5 * 60 * 1000),
  },
  {
    type: 'on_time',
    label: 'On time',
    getTime: (remindAt) => new Date(remindAt),
  },
  {
    type: 'evening_check',
    label: 'Evening check-in (7:00 PM)',
    getTime: (remindAt) => {
      const d = new Date(remindAt)
      d.setHours(19, 0, 0, 0)
      return d
    },
  },
]

export const REMINDER_MESSAGES: Record<ReminderType, (title: string) => { title: string; body: string }> = {
  early_morning: t => ({ title: '☀️ Good morning!', body: `Reminder: "${t}" is due today` }),
  before_15min: t => ({ title: '⏰ 15 minutes left', body: `"${t}" is due very soon` }),
  before_5min: t => ({ title: '⏰ 5 minutes left', body: `"${t}" is due in 5 minutes` }),
  on_time: t => ({ title: '🔔 Task due now', body: `"${t}" is due right now` }),
  evening_check: t => ({ title: '🌙 Still pending', body: `You haven't completed "${t}" yet` }),
}

export function generateReminderRows(taskId: number, userId: number, remindAt: Date) {
  const now = new Date()
  return REMINDER_CONFIG
    .map(cfg => ({
      taskId,
      userId,
      type: cfg.type,
      remindAt: cfg.getTime(remindAt).toISOString(),
    }))
    .filter(r => new Date(r.remindAt) > now) // only schedule future reminders
}
