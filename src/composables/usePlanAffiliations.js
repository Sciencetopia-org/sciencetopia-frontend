import { ref } from 'vue'
import { apiClient } from '@/api'

export function usePlanAffiliations(planId) {
  const groups = ref([])
  const loading = ref(false)

  async function refresh() {
    if (!planId) { groups.value = []; return }
    loading.value = true
    try {
      const res = await apiClient.get(`/studyPlans/${planId}/cohorts`)
      const cohorts = Array.isArray(res?.data) ? res.data : []
      const seen = new Map()
      for (const c of cohorts) {
        if (!c.studyGroupId) continue
        const key = String(c.studyGroupId)
        if (!seen.has(key)) {
          seen.set(key, { groupId: c.studyGroupId, groupName: c.groupName || c.title || key, shareMode: c.shareMode || 'Editable' })
        }
      }
      groups.value = Array.from(seen.values())
    } catch (_) {
      groups.value = []
    } finally {
      loading.value = false
    }
  }

  return { groups, loading, refresh }
}

export default usePlanAffiliations

