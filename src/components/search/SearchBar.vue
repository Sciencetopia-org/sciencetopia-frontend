<template>
  <div class="search-bar-container" ref="searchContainer">
    <div class="search-bar-shell">
      <div class="search-bar-shell__glow"></div>
      <v-text-field
        v-model="searchQuery"
        :placeholder="$t('searchbar.iwanttolearn')"
        variant="plain"
        density="comfortable"
        hide-details
        clearable
        :loading="isLoading"
        @keyup.enter="performSearch"
        @click:clear="clearSearch"
        ref="searchInput"
        class="search-bar-input"
      >
        <template #prepend-inner>
          <v-icon class="search-bar-input__leading">mdi-magnify</v-icon>
        </template>
        <template #append-inner>
          <v-btn
            icon
            size="small"
            variant="flat"
            class="search-bar-input__action"
            :loading="isLoading"
            :disabled="isLoading"
            @click="performSearch"
          >
            <v-icon>mdi-arrow-right</v-icon>
          </v-btn>
        </template>
      </v-text-field>

      <div v-if="showResults">
        <div v-if="isLoading" class="search-results-wrapper" aria-busy="true" aria-live="polite">
          <div class="search-results search-results--loading">
            <v-skeleton-loader
              type="heading, list-item-two-line, list-item-two-line, list-item-two-line"
            />
          </div>
        </div>
        <SearchResults
          v-else
          :results="formattedResults"
          @result-click="handleResultClick"
          @close="showResults = false"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { eventBus } from '@/eventBus'
import { apiClient } from '@/api'
import { hydrateCompletedStatuses } from '@/utils/resourceProgress'
import { isSafeUrl, safeUrl } from '@/utils/text'

import SearchResults from './SearchResults.vue'

export default {
  components: { SearchResults },
  setup() {
    const store = useStore()
    const searchQuery = ref('')
    const rawResults = ref([])
    const showResults = ref(false)
    const isLoading = ref(false)
    const searchContainer = ref(null)
    const searchInput = ref(null)
    const router = useRouter()
    const canLoadKnowledgeStates = computed(() => Boolean(store.state.currentUserID || store.state.userInfo?.id))

    // 将数组转换为按类型分组的对象
    const formattedResults = computed(() => {
      return {
        knowledge: rawResults.value.filter((item) => item.type === 'knowledge'),
        resources: rawResults.value.filter((item) => item.type === 'resources'),
        group: rawResults.value.filter((item) => item.type === 'group'),
      }
    })

    const doSearch = async (query) => {
      // Backend expects 'query' param (not 'q');
      // Response keys can be either camelCase or PascalCase depending on environment.
      const res = await apiClient.get('/Search', { params: { query } })
      const data = res?.data || {}

      // Normalize potential key casings from the API
      const kb = Array.isArray(data.knowledgeBase)
        ? data.knowledgeBase
        : Array.isArray(data.KnowledgeBase)
          ? data.KnowledgeBase
          : []

      const resources = Array.isArray(data.resources)
        ? data.resources
        : Array.isArray(data.Resources)
          ? data.Resources
          : []

      const groups = Array.isArray(data.studyGroups)
        ? data.studyGroups
        : Array.isArray(data.StudyGroups)
          ? data.StudyGroups
          : []

      // Map items to a unified shape expected by UI components
      const normKb = kb.map((k) => ({
        id: k.stableId ?? k.id ?? k.knowledgeId ?? k.ID,
        type: 'knowledge',
        title: k.title || k.name || '',
        excerpt: k.excerpt || k.description || '',
        learned: false,
      }))

      if (canLoadKnowledgeStates.value && normKb.length) {
        try {
          const nodeIds = normKb.map((item) => item.id).filter(Boolean)
          if (nodeIds.length) {
            const stateResponse = await apiClient.post('/KnowledgeGraph/Favorites/NodeStates', { nodeIds })
            const stateMap = new Map(
              (Array.isArray(stateResponse?.data) ? stateResponse.data : []).map((state) => [String(state?.nodeId), state])
            )
            normKb.forEach((item) => {
              const state = stateMap.get(String(item.id))
              item.learned = state?.isLearned === true
            })
          }
        } catch (error) {
          console.warn('Failed to hydrate knowledge learned states for search results', error)
        }
      }

      const normResources = resources.map((r) => ({
        id: r.id ?? r.resourceId ?? r.ID,
        type: 'resources',
        title: r.title || r.name || r.link || '',
        excerpt: r.excerpt || r.description || r.link || '',
        link: r.link || r.url || undefined,
        learned: false,
      }))

      await hydrateCompletedStatuses(normResources)

      const normGroups = groups.map((g) => ({
        id: g.id ?? g.groupId ?? g.ID,
        type: 'group',
        title: g.title || g.name || '',
        excerpt: g.excerpt || g.description || '',
      }))

      return [...normKb, ...normResources, ...normGroups]
    }

    const performSearch = async () => {
      const q = searchQuery.value.trim()
      if (!q) return
      try {
        isLoading.value = true
        showResults.value = true
        rawResults.value = []
        rawResults.value = await doSearch(q)
        console.log('Search results:', formattedResults.value)
      } catch (err) {
        console.error('Search error:', err)
        showResults.value = false
      } finally {
        isLoading.value = false
      }
    }

    const clearSearch = () => {
      searchQuery.value = ''
      rawResults.value = []
      showResults.value = false
    }

    const handleResultClick = (result) => {
      if (!result) return
      if (result.type === 'plan') {
        window.open(`/plans/${result.id}`, '_blank', 'noopener,noreferrer')
      } else if (result.type === 'group') {
        window.open(`/studygroup/${result.id}`, '_blank', 'noopener,noreferrer')
      } else if (result.type === 'resources') {
        if (isSafeUrl(result.link)) {
          window.open(safeUrl(result.link), '_blank', 'noopener,noreferrer')
        }
      } else {
        // For knowledge or unknown types, keep the panel open for now
        // Optionally, navigate to a dedicated detail page if available in the future.
      }
    }

    // Close on outside click
    onClickOutside(searchContainer, () => {
      eventBus.emit('hide-search-bar')
    })

    // Close on route change
    onMounted(() => {
      nextTick(() => {
        searchInput.value?.focus?.()
      })
      router.afterEach(() => {
        eventBus.emit('hide-search-bar')
      })
    })

    // Close on ESC key
    const onEscapeKey = (e) => {
      if (e.key === 'Escape') {
        eventBus.emit('hide-search-bar')
      }
    }

    onMounted(() => document.addEventListener('keydown', onEscapeKey))
    onBeforeUnmount(() => document.removeEventListener('keydown', onEscapeKey))

      return {
        searchQuery,
        formattedResults,
        showResults,
        isLoading,
        performSearch,
        clearSearch,
        handleResultClick,
        searchContainer,
        searchInput,
      }
  },
}
</script>

<style scoped>
.search-bar-container {
  position: fixed;
  top: 18px;
  left: 0;
  right: 0;
  z-index: 2000;
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  padding: 0 20px;
}

.search-bar-shell {
  position: relative;
  border-radius: 28px;
  padding: 12px;
  background: #f1e9d7;
  border: 1px solid rgba(197, 159, 89, 0.34);
  box-shadow:
    0 22px 60px rgba(48, 78, 117, 0.12),
    0 8px 22px rgba(48, 78, 117, 0.06);
  backdrop-filter: blur(16px);
}

.search-bar-shell__glow {
  display: none;
}

.search-bar-input {
  position: relative;
  z-index: 1;
}

.search-bar-input :deep(.v-field) {
  border-radius: 20px;
  min-height: 62px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(197, 159, 89, 0.28);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
  transition: border-color 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease;
}

.search-bar-input:hover :deep(.v-field),
.search-bar-input:focus-within :deep(.v-field) {
  background: rgba(255, 255, 255, 0.98);
  border-color: rgba(48, 78, 117, 0.34);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 0 0 4px rgba(48, 78, 117, 0.12);
}

.search-bar-input :deep(.v-field__input) {
  padding-top: 18px;
  padding-bottom: 18px;
  color: #304e75;
  font-size: 1.05rem;
}

.search-bar-input :deep(.v-field__input::placeholder) {
  color: rgba(48, 78, 117, 0.58);
}

.search-bar-input :deep(.v-field__clearable),
.search-bar-input :deep(.v-field__append-inner),
.search-bar-input :deep(.v-field__prepend-inner) {
  align-items: center;
}

.search-bar-input__leading {
  color: #304e75;
  opacity: 0.9;
}

.search-bar-input__action {
  background: #304e75 !important;
  color: #ffffff !important;
  box-shadow: none !important;
  transition: transform 0.18s ease, background-color 0.18s ease;
}

.search-bar-input__action:hover {
  transform: translateX(1px);
  background: #ec0017 !important;
}

.search-results--loading {
  padding: 18px;
}

@media (max-width: 720px) {
  .search-bar-container {
    top: 10px;
    padding: 0 12px;
  }

  .search-bar-shell {
    border-radius: 22px;
    padding: 10px;
  }

  .search-bar-input :deep(.v-field) {
    min-height: 56px;
  }

  .search-bar-input :deep(.v-field__input) {
    font-size: 1rem;
  }
}

.search-bar-enter-active,
.search-bar-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.search-bar-enter-from,
.search-bar-leave-to {
  opacity: 0;
  transform: translateY(-14px);
}
</style>
