// useNodeDetailsCache.js
import { reactive } from 'vue'
import { apiClient } from '@/api'

const NODE_DETAIL_ENDPOINT = '/KnowledgeGraph/GetNodeDetails'
const DEFAULT_TTL_MS = 10 * 60 * 1000
const MAX_ENTRIES = 1000

const state = reactive({
  cache: new Map(),            // id -> { data, updatedAt, etag, lastAccess }
  inflightPromises: new Map(), // id -> Promise
})

const now = () => Date.now()
const isExpired = (entry, ttl = DEFAULT_TTL_MS) => !entry || (now() - entry.updatedAt > ttl)
const touch = (id, entry) => { entry.lastAccess = now(); state.cache.delete(id); state.cache.set(id, entry) }
const evictIfNeeded = () => {
  if (state.cache.size <= MAX_ENTRIES) return
  let oldestKey = null, oldest = Infinity
  for (const [k, v] of state.cache.entries()) if (v.lastAccess < oldest) { oldest = v.lastAccess; oldestKey = k }
  if (oldestKey) state.cache.delete(oldestKey)
}

async function getNodeDetail(id, opts = {}) {
  const { forceRefresh = false, ttlMs = DEFAULT_TTL_MS, revalidate = true } = opts
  const cached = state.cache.get(id)
  const fresh = cached && !isExpired(cached, ttlMs)

  if (!forceRefresh && fresh) {
    touch(id, cached)
    if (revalidate) void revalidateInBg(id, cached)
    return cached.data
  }
  if (state.inflightPromises.has(id)) return state.inflightPromises.get(id)

  const req = (async () => {
    try {
      const headers = {}
      if (cached?.etag) headers['If-None-Match'] = cached.etag

      // 关键改动：使用 GET + params 传 nodeId
      const res = await apiClient.get(NODE_DETAIL_ENDPOINT, {
        params: { nodeId: id },
        headers,
        // 有些后端/代理会对 304 做特殊处理；axios 默认把 304 当成功
        validateStatus: s => (s >= 200 && s < 300) || s === 304,
      })

      if (res.status === 304 && cached) {
        // 服务器确认未变更：刷新时间并返回旧缓存
        cached.updatedAt = now()
        touch(id, cached)
        return cached.data
      }

      const data = res.data
      const etag = res.headers?.etag
      const entry = { data, updatedAt: now(), etag: etag || cached?.etag, lastAccess: now() }
      state.cache.set(id, entry)
      evictIfNeeded()
      return data
    } finally {
      state.inflightPromises.delete(id)
    }
  })()

  state.inflightPromises.set(id, req)
  return req
}

async function revalidateInBg(id, cached) {
  try {
    const headers = {}
    if (cached?.etag) headers['If-None-Match'] = cached.etag
    const res = await apiClient.get(NODE_DETAIL_ENDPOINT, {
      params: { nodeId: id },
      headers,
      validateStatus: s => (s >= 200 && s < 300) || s === 304,
    })
    if (res.status === 304) { cached.updatedAt = now(); touch(id, cached); return }
    const etag = res.headers?.etag
    const serverData = res.data
    const changed = (etag && etag !== cached?.etag) ||
                    (serverData?.updatedDate && serverData.updatedDate !== cached?.data?.updatedDate)
    if (changed) {
      state.cache.set(id, { data: serverData, updatedAt: now(), etag: etag || cached?.etag, lastAccess: now() })
      evictIfNeeded()
    } else {
      cached.updatedAt = now()
      touch(id, cached)
    }
  } catch { /* 静默失败 */ }
}

function invalidateNode(id) { state.cache.delete(id) }
function primeNode(id, data, etag) {
  state.cache.set(id, { data, updatedAt: now(), etag, lastAccess: now() })
  evictIfNeeded()
}

export function useNodeDetailsCache() {
  return { getNodeDetail, invalidateNode, primeNode, _state: state }
}
