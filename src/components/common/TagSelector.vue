<template>
  <v-combobox
    v-model="selection"
    :items="options"
    :item-title="itemTitle"
    :item-value="itemValue"
    :label="label"
    :placeholder="placeholder || $t('searchTagsPlaceholder')"
    :loading="loading"
    :hide-selected="true"
    :search="query"
    :multiple="true"
    chips
    closable-chips
    :chip-props="{ closable: true }"
    clearable
    density="compact"
    variant="outlined"
    @update:search="onSearch"
  />
</template>

<script>
import { ref, watch, nextTick } from 'vue'
import { apiClient } from '@/api'

export default {
  name: 'TagSelector',
  props: {
    modelValue: { type: Array, default: () => [] },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    max: { type: Number, default: 10 },
    returnMode: { type: String, default: 'mixed' }, // 'mixed' | 'names' | 'objects'
    itemTitle: { type: String, default: 'name' },
    itemValue: { type: String, default: 'id' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const selection = ref([...(props.modelValue || [])])
    const options = ref([])
    const loading = ref(false)
    const query = ref('')
    let tId = null
    let syncing = false
    let lastEmitted = null

    const normalize = (arr) => {
      const out = []
      const seenIds = new Set()
      const seenNames = new Set()
      for (const raw of Array.isArray(arr) ? arr : []) {
        const isObj = raw && typeof raw === 'object'
        const id = isObj ? (raw.id || raw.Id || raw.ID) : null
        const name = String(isObj ? (raw.name || raw.Name || '') : raw || '')
        const keyName = name.trim().toLowerCase()
        if (id) {
          if (seenIds.has(id)) continue
          if (keyName && seenNames.has(keyName)) {
            const idx = out.findIndex(x => {
              const io = x && typeof x === 'object'
              if (io && (x.id || x.Id || x.ID)) return false
              const nm = String(io ? (x.name || x.Name || '') : x || '')
              return nm.trim().toLowerCase() === keyName
            })
            if (idx >= 0) out.splice(idx, 1)
          }
          seenIds.add(id)
          if (isObj) out.push(raw)
          else out.push({ id, name })
          if (keyName) seenNames.add(keyName)
        } else if (keyName) {
          if (seenNames.has(keyName)) continue
          seenNames.add(keyName)
          out.push(name)
        }
      }
      return out
    }

    const convertForEmit = (arr) => {
      if (props.returnMode === 'names') {
        return (arr || []).map(x => (typeof x === 'object' ? (x.name || x.Name || '') : x)).filter(Boolean)
      }
      if (props.returnMode === 'objects') {
        return (arr || []).map(x => (typeof x === 'object' ? x : { name: x }))
      }
      return arr
    }

    const isSame = (a, b) => {
      try {
        return JSON.stringify(a) === JSON.stringify(b)
      } catch { return false }
    }

    const onSearch = async (q) => {
      query.value = q
      if (tId) clearTimeout(tId)
      tId = setTimeout(async () => {
        try {
          if (!q || !q.trim()) { options.value = []; return }
          loading.value = true
          const res = await apiClient.get('/KnowledgeGraph/SearchTags', { params: { query: q } })
          const list = Array.isArray(res?.data) ? res.data : (res?.data?.tags || [])
          options.value = list
        } catch { options.value = [] }
        finally { loading.value = false }
      }, 250)
    }

    watch(() => props.modelValue, (val) => {
      syncing = true
      selection.value = normalize(val)
      if (selection.value.length > props.max) selection.value = selection.value.slice(0, props.max)
      nextTick(() => { syncing = false })
    }, { immediate: true, deep: true })

    watch(selection, (val) => {
      if (syncing) return
      const normalized = normalize(val)
      const capped = normalized.length > props.max ? normalized.slice(0, props.max) : normalized
      // Avoid self-recursion: only assign if actually different
      if (!isSame(selection.value, capped)) {
        syncing = true
        selection.value = capped
        nextTick(() => { syncing = false })
      }
      const payload = convertForEmit(capped)
      if (!isSame(payload, lastEmitted)) {
        lastEmitted = payload
        emit('update:modelValue', payload)
      }
    }, { deep: true })

    return { selection, options, loading, query, onSearch }
  }
}
</script>

<style scoped>
</style>
