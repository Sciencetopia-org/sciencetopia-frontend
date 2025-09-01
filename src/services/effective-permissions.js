import { apiClient } from '@/api'

const CACHE_TTL_MS = 60 * 1000
const cache = new Map() // key => { data, expires }

function keyOf(planId, cohortId) {
  return `${planId || ''}::${cohortId || ''}`
}

function now() {
  return Date.now()
}

export async function fetchEffectivePermissions({ planId, cohortId, force = false }) {
  const key = keyOf(planId, cohortId)
  if (!force) {
    const hit = cache.get(key)
    if (hit && hit.expires > now()) return hit.data
  }
  // Try canonical lower-case path; fall back to alternates for compatibility
  let data = null
  try {
    const res = await apiClient.get('/permissions/effective', { params: { planId, cohortId } })
    data = res?.data || null
  } catch (_) {
    try {
      const res2 = await apiClient.get(`/studyplans/${planId}/permissions/effective`, { params: { cohortId } })
      data = res2?.data || null
    } catch (_) {
      try {
        const res3 = await apiClient.get(`/StudyPlans/${planId}/Permissions/Effective`, { params: { cohortId } })
        data = res3?.data || null
      } catch (_) {
        data = null
      }
    }
  }
  const normalized = normalizeBooleans(data)
  cache.set(key, { data: normalized, expires: now() + CACHE_TTL_MS })
  return normalized
}

function normalizeBooleans(raw) {
  const b = (v) => !!v
  const r = raw || {}
  return {
    CanEditPlan: b(r.CanEditPlan ?? r.canEditPlan),
    CanPublishVersion: b(r.CanPublishVersion ?? r.canPublishVersion),
    CanManageCohort: b(r.CanManageCohort ?? r.canManageCohort),
    CanInviteToCohort: b(r.CanInviteToCohort ?? r.canInviteToCohort),
    CanUpgradeCohortVersion: b(r.CanUpgradeCohortVersion ?? r.canUpgradeCohortVersion),
    CanViewPlan: b(r.CanViewPlan ?? r.canViewPlan ?? true),
  }
}

export function invalidateEffectivePermissions(planId, cohortId) {
  cache.delete(keyOf(planId, cohortId))
}

export default {
  fetchEffectivePermissions,
  invalidateEffectivePermissions,
}

