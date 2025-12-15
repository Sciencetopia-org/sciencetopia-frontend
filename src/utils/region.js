import { apiClient } from '@/api'

let cached = null
let inflight = null

export async function isMainlandChina() {
  if (cached !== null) return cached
  if (inflight) return inflight
  inflight = (async () => {
    try {
      // Prefer backend which resolves client IP from server-side
      const res = await apiClient.get('/Region/Me')
      const val = !!(res?.data?.isMainlandChina)
      cached = val
      return val
    } catch (_) {
      // Fallback to public IP geo if backend unavailable
      try {
        const r = await fetch('https://ipapi.co/json/')
        if (r.ok) {
          const data = await r.json()
          const val = (data && (data.country || data.country_code) === 'CN' || data.country_code === 'CN')
          cached = !!val
          return cached
        }
      } catch (_) {}
      cached = false
      return false
    } finally {
      inflight = null
    }
  })()
  return inflight
}

