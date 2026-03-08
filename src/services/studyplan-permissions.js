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
  const derive = (data) => {
    if (!data || typeof data !== 'object') return null
    const r = String(data.role ?? data.Role ?? data.effectiveRole ?? '').trim()
    if (r) {
      const lower = r.toLowerCase()
      if (lower === 'manager' || lower === 'admin') return 'Admin'
      if (lower === 'member') return 'Member'
      if (lower === 'owner') return 'Owner'
      if (lower === 'editor') return 'Editor'
      if (lower === 'commenter') return 'Commenter'
      if (lower === 'viewer') return 'Viewer'
      return r
    }
    const canEdit = !!(data.CanEdit ?? data.canEdit ?? data.CanEditPlan ?? data.canEditPlan)
    const canComment = !!(data.CanComment ?? data.canComment)
    const canView = !!(data.CanView ?? data.canView ?? data.CanViewPlan ?? data.canViewPlan)
    if (canEdit) return 'Editor'
    if (canComment) return 'Commenter'
    if (canView) return 'Viewer'
    return null
  }

  try {
    const res = await apiClient.get(`/StudyPlans/${planId}/Permissions/Effective`)
    const role = derive(res?.data)
    if (role) setCache(planId, role)
    return role
  } catch (_) {}

  try {
    const fallback = await apiClient.get('/Permissions/Effective', { params: { planId } })
    const role = derive(fallback?.data)
    if (role) setCache(planId, role)
    return role
  } catch (_) {
    return null
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
  return role === 'Owner' || role === 'Editor' || role === 'Admin'
}

export function roleAllowsComment(role) {
  return role === 'Owner' || role === 'Editor' || role === 'Commenter' || role === 'Admin' || role === 'Member'
}

export default {
  fetchEffectiveRole,
  getRole,
  invalidateRole,
  roleAllowsEdit,
  roleAllowsComment,
}
