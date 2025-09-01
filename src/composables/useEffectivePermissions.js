import { ref, watch } from 'vue'
import { fetchEffectivePermissions } from '@/services/effective-permissions'

export function useEffectivePermissions(planIdRef, cohortIdRef) {
  const perms = ref(null)
  const loading = ref(false)

  async function refresh() {
    if (!planIdRef?.value) { perms.value = null; return }
    loading.value = true
    try {
      perms.value = await fetchEffectivePermissions({ planId: planIdRef.value, cohortId: cohortIdRef?.value })
    } catch (_) {
      perms.value = null
    } finally {
      loading.value = false
    }
  }

  watch([planIdRef, cohortIdRef], refresh, { immediate: true })

  return { perms, loading, refresh }
}

export default useEffectivePermissions

