import { ref } from 'vue'
import { apiClient } from '@/api'

const cache = new Map() // planId -> { plan: ref, loading: ref }

export function usePlan(planId) {
  const key = String(planId || '')
  if (!cache.has(key)) {
    cache.set(key, { plan: ref(null), loading: ref(false) })
  }
  const entry = cache.get(key)

  async function refresh() {
    if (!planId) { entry.plan.value = null; return }
    entry.loading.value = true
    try {
      const res = await apiClient.get('/StudyPlan/GetStudyPlanById', { params: { studyPlanId: planId } })
      const raw = res?.data?.studyPlan || res?.data
      entry.plan.value = normalizePlan(raw)
    } catch (_) {
      entry.plan.value = null
    } finally {
      entry.loading.value = false
    }
  }

  return { plan: entry.plan, loading: entry.loading, refresh }
}

function normalizePlan(plan) {
  if (!plan) return null
  const sections = ['prerequisite', 'mainCurriculum', 'advancedTopics']
  const out = { ...plan }
  sections.forEach((sec) => { if (out[sec]) out[sec] = mergeLessons(out[sec]) })
  return out
}

function mergeLessons(lessons) {
  const map = new Map()
  lessons.forEach((lesson) => {
    const existing = map.get(lesson.name)
    if (existing) {
      const resources = lesson.resources || []
      existing.resources = existing.resources.concat(resources)
    } else {
      map.set(lesson.name, { ...lesson, resources: lesson.resources ? [...lesson.resources] : [] })
    }
  })
  return Array.from(map.values())
}

export default usePlan

