// /src/composables/useSelectedNodeDetails.js
import { ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useNodeDetailsCache } from '@/composables/useNodeDetailsCache'
import axios from 'axios'

export function useSelectedNodeDetails(options = {}) {
  const { revalidate = true } = options
  const store = useStore()
  const { getNodeDetail } = useNodeDetailsCache()

  const detailedSelectedNodes = ref([])   // [{ id, name, description, resources, ... }, ...]
  const loading = ref(false)
  const error = ref(null)

  let alive = true
  let requestSeq = 0
  let activeController = null
  const cancelActiveRequest = () => {
    if (activeController) {
      activeController.abort()
      activeController = null
    }
  }
  onBeforeUnmount(() => {
    alive = false
    cancelActiveRequest()
  })
  
  // Refresh node details when language changes (to update localized name/description)
  onMounted(() => {
    try { window.addEventListener('app:lang-changed', refreshDetails) } catch (_) {}
  })
  onBeforeUnmount(() => {
    try { window.removeEventListener('app:lang-changed', refreshDetails) } catch (_) {}
  })

  async function refreshDetails() {
    cancelActiveRequest()
    const selected = store.state.selectedNodes || []
    if (!selected.length) {
      detailedSelectedNodes.value = []
      loading.value = false
      error.value = null
      return
    }

    const currentRequestId = ++requestSeq
    activeController = new AbortController()
    const signal = activeController.signal
    loading.value = true
    error.value = null

    try {
      const promises = selected.map(n =>
        n?.id ? getNodeDetail(n.id, { forceRefresh: true, revalidate, signal }) : Promise.resolve(null)
      )
      const results = await Promise.allSettled(promises)

      if (!alive || signal.aborted || currentRequestId !== requestSeq) return
      detailedSelectedNodes.value = results.map((r, i) => {
        const fallback = selected[i] || {}
        if (r.status === 'fulfilled' && r.value) {
          // 和你的详情返回格式对齐
          return {
            id: r.value.id ?? fallback.id,
            name: r.value.name ?? fallback.name,
            description: r.value.description ?? '',
            resources: r.value.resources ?? [],
            tags: r.value.tags ?? [],
            createdDate: r.value.createdDate,
            updatedDate: r.value.updatedDate,
          }
        }
        return { id: fallback.id, name: fallback.name, description: '', resources: [], tags: [] }
      })
    } catch (e) {
      if (!alive || signal.aborted || currentRequestId !== requestSeq || axios.isCancel(e) || e?.code === 'ERR_CANCELED') return
      error.value = e
    } finally {
      if (activeController?.signal === signal) {
        activeController = null
      }
      if (alive && !signal.aborted && currentRequestId === requestSeq) loading.value = false
    }
  }

  // 当选中项变化时更新详情
  watch(
    () => store.state.selectedNodes,
    () => { refreshDetails() },
    { deep: false }
  )

  return { detailedSelectedNodes, loading, error, refreshDetails }
}
