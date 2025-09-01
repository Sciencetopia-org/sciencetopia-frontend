import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:5085/api', // 替换为您的API的基础URL
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

const pyApiClient = axios.create({
  baseURL: 'http://localhost:5086/api', // 替换为您的API的基础URL
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export { apiClient, pyApiClient }

// --------------------------------------------
// Dev mocks: redirect certain requests to /mock
// Controlled by VUE_APP_USE_MOCKS and NODE_ENV
// --------------------------------------------
const useMocks = process.env.NODE_ENV === 'development' && String(process.env.VUE_APP_USE_MOCKS).toLowerCase() === 'true'

function matchMockPath(config) {
  const method = (config.method || 'get').toLowerCase()
  if (method !== 'get') return null
  const url = (config.url || '').replace(/^https?:\/\/[^/]+/, '')
  const params = config.params || {}

  // Helper to extract matches
  const m = (re) => {
    const r = re.exec(url)
    return r ? r.slice(1) : null
  }

  // 1) Study plans list
  if (/^\/StudyPlans$/i.test(url)) {
    return '/mock/studyplans/list.json'
  }

  // 2) Study plan by id (legacy)
  if (/^\/StudyPlan\/GetStudyPlanById$/i.test(url) && (params.studyPlanId || params.planId)) {
    const pid = params.studyPlanId || params.planId
    return `/mock/studyplans/plan-${pid}.json`
  }

  // 3) Cohorts by plan
  let cap = m(/^\/studyPlans\/([^/]+)\/cohorts$/i)
  if (cap) {
    const [planId] = cap
    return `/mock/cohorts/by-plan-${planId}.json`
  }

  // 4) Cohort summary/leaderboard
  cap = m(/^\/cohorts\/([^/]+)\/stats\/summary$/i)
  if (cap) {
    const [cohortId] = cap
    // Prefer cohort-only alias; fallback to specific file if needed
    return `/mock/cohorts/${cohortId}-summary.json`
  }
  cap = m(/^\/cohorts\/([^/]+)\/stats\/leaderboard$/i)
  if (cap) {
    const [cohortId] = cap
    return `/mock/cohorts/${cohortId}-leaderboard.json`
  }

  // 5) Joinable cohorts for a plan
  cap = m(/^\/plans\/([^/]+)\/joinable-cohorts$/i)
  if (cap) {
    const [planId] = cap
    return `/mock/joinable/${planId}.json`
  }

  // 6) Enrollment of me
  cap = m(/^\/plans\/([^/]+)\/enrollment\/me$/i)
  if (cap) {
    const [planId] = cap
    return `/mock/enrollment/${planId}-me.json`
  }

  // 7) Effective permissions (several forms)
  if (/^\/permissions\/effective$/i.test(url) && (params.planId || params.planID)) {
    const pid = params.planId || params.planID
    return `/mock/permissions/${pid}.json`
  }
  cap = m(/^\/studyplans\/([^/]+)\/permissions\/effective$/i)
  if (cap) {
    const [planId] = cap
    return `/mock/permissions/${planId}.json`
  }
  cap = m(/^\/StudyPlans\/([^/]+)\/Permissions\/Effective$/)
  if (cap) {
    const [planId] = cap
    return `/mock/permissions/${planId}.json`
  }

  // 8) Group plans list
  cap = m(/^\/groups\/([^/]+)\/plans$/i)
  if (cap) {
    const [groupId] = cap
    // Known demo groups; otherwise fall back to default
    if (/^(g-fe|g-ml)$/i.test(groupId)) return `/mock/groups/${groupId}-plans.json`
    return '/mock/groups/default-plans.json'
  }

  // 9) Study groups list
  if (/^\/StudyGroups$/i.test(url)) {
    return '/mock/studygroups/list.json'
  }

  // 10) Study group details and related
  cap = m(/^\/StudyGroup\/GetStudyGroupById\/([^/]+)$/i)
  if (cap) {
    // Use a shared detail stub for any id
    return '/mock/studygroups/detail.json'
  }
  cap = m(/^\/StudyGroup\/GetUserRoleInGroup\/([^/]+)$/i)
  if (cap) {
    return '/mock/studygroups/role.json'
  }
  cap = m(/^\/StudyGroup\/GetPendingJoinRequestsCount\/([^/]+)$/i)
  if (cap) {
    return '/mock/studygroups/pending-count.json'
  }

  // 11) Study group settings (manager/member view)
  cap = m(/^\/StudyGroup\/Settings\/([^/]+)$/i)
  if (cap) {
    const as = (params.as || '').toLowerCase()
    return as === 'manager' ? '/mock/studygroups/settings-manager.json' : '/mock/studygroups/settings-member.json'
  }

  // 12) Search endpoint (returns grouped results)
  cap = m(/^\/search$/i)
  if (cap !== null) {
    return '/mock/search/results.json'
  }

  return null
}

if (useMocks) {
  apiClient.interceptors.request.use((config) => {
    const mockPath = matchMockPath(config)
    if (mockPath) {
      const newConfig = { ...config }
      newConfig.baseURL = ''
      newConfig.url = mockPath
      newConfig.method = 'get'
      // Clear params for static files to avoid cache busting differences
      newConfig.params = undefined
      // Optional: mark as mocked
      newConfig.headers = { ...(config.headers || {}), 'X-Mock': 'true' }
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.debug('[MOCK]', config.url, '→', mockPath)
      }
      return newConfig
    }
    return config
  })
}
