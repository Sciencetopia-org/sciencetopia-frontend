// /src/composables/useSelectedNodeDetails.js
import { ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useNodeDetailsCache } from '@/composables/useNodeDetailsCache'

export function useSelectedNodeDetails(options = {}) {
  const { revalidate = true } = options
  const store = useStore()
  const { getNodeDetail } = useNodeDetailsCache()

  const detailedSelectedNodes = ref([])   // [{ id, name, description, resources, ... }, ...]
  const loading = ref(false)
  const error = ref(null)

  let alive = true
  onBeforeUnmount(() => { alive = false })
  
  // Refresh node details when language changes (to update localized name/description)
  onMounted(() => {
    try { window.addEventListener('app:lang-changed', refreshDetails) } catch (_) {}
  })
  onBeforeUnmount(() => {
    try { window.removeEventListener('app:lang-changed', refreshDetails) } catch (_) {}
  })

  async function refreshDetails() {
    const selected = store.state.selectedNodes || []
    if (!selected.length) {
      detailedSelectedNodes.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const promises = selected.map(n =>
        n?.id ? getNodeDetail(n.id, { forceRefresh: true, revalidate }) : Promise.resolve(null)
      )
      const results = await Promise.allSettled(promises)

      if (!alive) return
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
      if (!alive) return
      error.value = e
    } finally {
      if (alive) loading.value = false
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
