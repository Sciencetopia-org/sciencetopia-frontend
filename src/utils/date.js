// utils/date.js
export function normalizeDateString(input) {
  if (!input) return ''
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input
  if (typeof input === 'string' && input.includes('T')) return input.slice(0, 10)
  const d = new Date(input)
  if (!isNaN(d)) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return ''
}

export function dateStrToIsoWithLocalOffset(dateStr) {
  if (!dateStr) return null
  const local = new Date(dateStr)
  const offsetMin = -local.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${dateStr}T00:00:00${sign}${hh}:${mm}`
}

export function dateStrToIsoZulu(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  const localMidnight = new Date(y, m - 1, d, 0, 0, 0, 0)
  const utcMs = localMidnight.getTime() - localMidnight.getTimezoneOffset() * 60000
  return new Date(utcMs).toISOString()
}
