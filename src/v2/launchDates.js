const DAY_MS = 24 * 60 * 60 * 1000

function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date
}

export function getLaunchCountdown(targetDate, now = new Date()) {
  const target = parseDateOnly(targetDate)
  if (!target) return { kind: 'none', days: null, label: 'Set a target launch date' }
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((target.getTime() - today) / DAY_MS)
  if (days > 0) return { kind: 'future', days, label: days + (days === 1 ? ' day to launch' : ' days to launch') }
  if (days === 0) return { kind: 'today', days: 0, label: 'Launch day' }
  const overdue = Math.abs(days)
  return { kind: 'overdue', days: overdue, label: 'Overdue by ' + overdue + (overdue === 1 ? ' day' : ' days') }
}

export function addDaysToDateOnly(value, days) {
  const parsed = parseDateOnly(value)
  if (!parsed || !Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error('Choose a valid target date and an extension between 1 and 365 days.')
  }
  parsed.setUTCDate(parsed.getUTCDate() + days)
  return parsed.toISOString().slice(0, 10)
}

export function formatDateOnly(value) {
  const date = parseDateOnly(value)
  if (!date) return 'No target date'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
  }).format(date)
}
