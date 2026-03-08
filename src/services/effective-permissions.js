import { apiClient } from '@/api'

const CACHE_TTL_MS = 60 * 1000
const cache = new Map() // key => { data, expires }
const PLAN_ROLE_ORDER = ['Viewer', 'Commenter', 'Editor', 'Owner']

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

  let data = null
  try {
    const res = await apiClient.get(`/StudyPlans/${planId}/Permissions/Effective`, { params: { cohortId } })
    data = res?.data || null
  } catch (_) {
    try {
      // Backward-compatible fallback for richer cohort booleans if enabled
      const res2 = await apiClient.get('/Permissions/Effective', { params: { planId, cohortId } })
      data = res2?.data || null
    } catch (_) {
      data = null
    }
  }

  if (!data || typeof data !== 'object') {
    return null
  }

  const normalized = normalizePermissions(data)
  cache.set(key, { data: normalized, expires: now() + CACHE_TTL_MS })
  return normalized
}

function normalizeRole(value) {
  const v = String(value || '').trim().toLowerCase()
  if (!v) return null
  if (v === 'owner') return 'Owner'
  if (v === 'editor') return 'Editor'
  if (v === 'commenter') return 'Commenter'
  if (v === 'viewer') return 'Viewer'
  if (v === 'admin' || v === 'manager') return 'Admin'
  if (v === 'member') return 'Member'
  return null
}

function roleAtLeast(role, minimum) {
  const r = PLAN_ROLE_ORDER.indexOf(role)
  const m = PLAN_ROLE_ORDER.indexOf(minimum)
  if (r < 0 || m < 0) return false
  return r >= m
}

function normalizePermissions(raw) {
  const b = (v) => !!v
  const r = raw || {}
  const role = normalizeRole(r.role ?? r.Role ?? r.effectiveRole)

  const canView = b(r.CanView ?? r.canView ?? r.CanViewPlan ?? r.canViewPlan) || roleAtLeast(role, 'Viewer')
  const canComment = b(r.CanComment ?? r.canComment) || roleAtLeast(role, 'Commenter')
  const canEdit = b(r.CanEdit ?? r.canEdit ?? r.CanEditPlan ?? r.canEditPlan) || roleAtLeast(role, 'Editor') || role === 'Admin'
  const canPublish = b(r.CanPublish ?? r.canPublish ?? r.CanPublishVersion ?? r.canPublishVersion) || role === 'Owner'
  const canManageCohort = b(r.CohortManage ?? r.cohortManage ?? r.CanManageCohort ?? r.canManageCohort) || role === 'Admin' || role === 'Owner'
  const canInviteCohort = b(r.CohortInvite ?? r.cohortInvite ?? r.CanInviteToCohort ?? r.canInviteToCohort) || canManageCohort

  return {
    role,
    CanView: canView,
    CanComment: canComment,
    CanEdit: canEdit,
    CanPublish: canPublish,
    CohortManage: canManageCohort,
    CohortInvite: canInviteCohort,
    // Legacy aliases used by existing components
    CanViewPlan: canView,
    CanEditPlan: canEdit,
    CanPublishVersion: canPublish,
    CanManageCohort: canManageCohort,
    CanInviteToCohort: canInviteCohort,
    CanUpgradeCohortVersion: b(r.CanUpgradeCohortVersion ?? r.canUpgradeCohortVersion) || canManageCohort || canPublish,
  }
}

export function invalidateEffectivePermissions(planId, cohortId) {
  cache.delete(keyOf(planId, cohortId))
}

export default {
  fetchEffectivePermissions,
  invalidateEffectivePermissions,
}
