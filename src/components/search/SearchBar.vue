<template>
  <div class="search-bar-container" ref="searchContainer">
    <v-text-field
      v-model="searchQuery"
      :placeholder="$t('searchbar.iwanttolearn')"
      solo
      hide-details
      clearable
      :loading="isLoading"
      @keyup.enter="performSearch"
      @click:clear="clearSearch"
      ref="searchInput"
    >
      <template v-slot:append>
        <v-btn icon :loading="isLoading" :disabled="isLoading" @click="performSearch">
          <v-icon>mdi-magnify</v-icon>
        </v-btn>
      </template>
    </v-text-field>

    <div v-if="showResults">
      <div v-if="isLoading" class="search-results-wrapper" aria-busy="true" aria-live="polite">
        <div class="search-results">
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
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { eventBus } from '@/eventBus'
import { apiClient } from '@/api'

import SearchResults from './SearchResults.vue'

export default {
  components: { SearchResults },
  setup() {
    const searchQuery = ref('')
    const rawResults = ref([])
    const showResults = ref(false)
    const isLoading = ref(false)
    const searchContainer = ref(null)
    const router = useRouter()

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
        id: k.id ?? k.knowledgeId ?? k.ID,
        type: 'knowledge',
        title: k.title || k.name || '',
        excerpt: k.excerpt || k.description || '',
      }))

      const normResources = resources.map((r) => ({
        id: r.id ?? r.resourceId ?? r.ID,
        type: 'resources',
        title: r.title || r.name || r.link || '',
        excerpt: r.excerpt || r.description || r.link || '',
        link: r.link || r.url || undefined,
      }))

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
        window.open(`/plans/${result.id}`, '_blank')
      } else if (result.type === 'group') {
        window.open(`/studygroup/${result.id}`, '_blank')
      } else if (result.type === 'resources') {
        if (result.link) {
          window.open(result.link, '_blank')
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
      }
  },
}
</script>

<style scoped>
.search-bar-container {
  position: fixed; /* Float on top */
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000; /* High enough to be above most content */
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 12px 24px;
  background-color: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* Optional: smooth fade-in */
.search-bar-enter-active,
.search-bar-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.search-bar-enter-from,
.search-bar-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
