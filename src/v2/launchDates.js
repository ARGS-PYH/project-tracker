const DAY_MS = 24 * 60 * 60 * 1000

function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

export function getLaunchCountdown(targetDate, now = new Date()) {
  const date = parseDateOnly(targetDate)
  if (!date) return { kind: 'none', days: null, hours: 0, minutes: 0, seconds: 0, label: 'Set a target launch date', compactLabel: 'No launch date' }

  // A date-only target is treated as the end of that local calendar day.
  // This keeps the clock counting throughout launch day instead of expiring at midnight.
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0)
  const remainingMs = target.getTime() - now.getTime()

  if (remainingMs > 0) {
    const totalSeconds = Math.floor(remainingMs / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const parts = [
      days ? days + 'd' : '',
      String(hours).padStart(2, '0') + 'h',
      String(minutes).padStart(2, '0') + 'm',
      String(seconds).padStart(2, '0') + 's'
    ].filter(Boolean)
    const label = days
      ? days + ' ' + (days === 1 ? 'day' : 'days') + ' ' + hours + 'h ' + minutes + 'm ' + seconds + 's remaining'
      : hours + 'h ' + minutes + 'm ' + seconds + 's remaining'
    return {
      kind: days > 0 ? 'future' : 'today',
      days,
      hours,
      minutes,
      seconds,
      label,
      compactLabel: parts.join(' ')
    }
  }

  const overdueMs = Math.abs(remainingMs)
  const overdueDays = Math.max(1, Math.ceil(overdueMs / DAY_MS))
  const totalSeconds = Math.floor(overdueMs / 1000)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const compactLabel = 'Overdue ' + overdueDays + 'd ' + String(hours).padStart(2, '0') + 'h ' + String(minutes).padStart(2, '0') + 'm ' + String(seconds).padStart(2, '0') + 's'
  return {
    kind: 'overdue',
    days: overdueDays,
    hours,
    minutes,
    seconds,
    label: 'Overdue by ' + overdueDays + (overdueDays === 1 ? ' day' : ' days'),
    compactLabel
  }
}

export function addDaysToDateOnly(value, days) {
  const parsed = parseDateOnly(value)
  if (!parsed || !Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error('Choose a valid target date and an extension between 1 and 365 days.')
  }
  parsed.setDate(parsed.getDate() + days)
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0')
  ].join('-')
}

export function formatDateOnly(value) {
  const date = parseDateOnly(value)
  if (!date) return 'No target date'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}
