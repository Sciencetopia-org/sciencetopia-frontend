// Lightweight client-side cache and helpers for Study Plan effective roles
import { apiClient } from '@/api'

const CACHE_TTL_MS = 90 * 1000 // ~1.5 minutes

const roleCache = new Map() // planId -> { role, expiresAt }

function now() {
  return Date.now()
}

function getCached(planId) {
  const entry = roleCache.get(String(planId))
  if (entry && entry.expiresAt > now()) return entry.role
  if (entry) roleCache.delete(String(planId))
  return null
}

function setCache(planId, role) {
  roleCache.set(String(planId), { role, expiresAt: now() + CACHE_TTL_MS })
}

export async function fetchEffectiveRole(planId, { force = false } = {}) {
  if (!force) {
    const cached = getCached(planId)
    if (cached) return cached
  }
  // Prefer legacy path used in this repo; fall back to RESTful
  const derive = (data) => {
    if (!data || typeof data !== 'object') return null
    // Prefer explicit fields
    const r = data.effectiveRole || data.role
    if (typeof r === 'string' && r) return r
    // Fallback: derive from capability booleans in mock or backend responses
    const canEdit = !!(data.CanEditPlan ?? data.canEditPlan)
    const canManage = !!(data.CanManageCohort ?? data.canManageCohort)
    const canUpgrade = !!(data.CanUpgradeCohortVersion ?? data.canUpgradeCohortVersion)
    const canView = !!(data.CanViewPlan ?? data.canViewPlan)
    if (canEdit && (canManage || canUpgrade)) return 'Owner'
    if (canEdit) return 'Editor'
    if (canView) return 'Viewer'
    return null
  }
  try {
    const resLegacy = await apiClient.get('/StudyPlan/GetEffectiveRole', { params: { studyPlanId: planId } })
    const roleLegacy = derive(resLegacy?.data)
    if (roleLegacy) {
      setCache(planId, roleLegacy)
      return roleLegacy
    }
  } catch (_) {}
  try {
    const res = await apiClient.get(`/StudyPlans/${planId}/Permissions/Effective`)
    const role = derive(res?.data)
    if (role) setCache(planId, role)
    return role
  } catch (_) {
    // final fallback: newer lowercase api path if present
    try {
      const res2 = await apiClient.get(`/api/studyplans/${planId}/permissions/effective`)
      const role2 = derive(res2?.data)
      if (role2) setCache(planId, role2)
      return role2
    } catch (_) {
      return null
    }
  }
}

export function getRole(planId) {
  return getCached(planId)
}

export function invalidateRole(planId) {
  if (planId) roleCache.delete(String(planId))
  else roleCache.clear()
}

export function roleAllowsEdit(role) {
  return role === 'Owner' || role === 'Editor'
}

export function roleAllowsComment(role) {
  return role === 'Owner' || role === 'Editor' || role === 'Commenter'
}

export default {
  fetchEffectiveRole,
  getRole,
  invalidateRole,
  roleAllowsEdit,
  roleAllowsComment,
}
