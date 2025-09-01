import { ref, computed } from 'vue'
import { apiClient } from '@/api'

const keyOf = (planId, scope, detail) => `${planId || ''}::${scope?.type}:${scope?.groupId || ''}:${detail}`
const cache = new Map() // key -> { summary, full, loading }

export function useProgress(planId, scope = { type: 'me' }, opts = { detail: 'summary' }) {
  const detail = opts?.detail || 'summary'
  const key = keyOf(planId, scope, detail)
  if (!cache.has(key)) cache.set(key, { data: ref(null), loading: ref(false) })
  const entry = cache.get(key)

  async function refresh() {
    if (!planId) { entry.data.value = null; return }
    entry.loading.value = true
    try {
      if (scope?.type === 'me') {
        const res = await apiClient.get(`/studyPlans/${planId}/progress/me`)
        entry.data.value = { planProgress: res?.data?.planProgress ?? null }
      } else if (scope?.type === 'group') {
        // Minimal group summary; backend shape may differ across services.
        // Fallback to cohorts listing then choose the first with studyGroupId matching.
        const list = await apiClient.get(`/studyPlans/${planId}/cohorts`) // expected array
        const cohorts = Array.isArray(list?.data) ? list.data : []
        const target = cohorts.find(c => String(c.studyGroupId) === String(scope.groupId))
        if (target) {
          const sum = await apiClient.get(`/cohorts/${target.id}/stats/summary`)
          entry.data.value = sum?.data || null
        } else {
          entry.data.value = null
        }
      }
    } catch (_) {
      entry.data.value = null
    } finally {
      entry.loading.value = false
    }
  }

  return { progress: entry.data, loading: entry.loading, refresh }
}

export default useProgress

