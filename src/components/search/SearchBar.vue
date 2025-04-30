<template>
  <div class="search-bar-container" ref="searchContainer">
    <v-text-field
      v-model="searchQuery"
      placeholder="Search..."
      solo
      hide-details
      clearable
      @keyup.enter="performSearch"
      @click:clear="clearSearch"
      ref="searchInput"
    >
      <template v-slot:append>
        <v-btn icon @click="performSearch">
          <v-icon>mdi-magnify</v-icon>
        </v-btn>
      </template>
    </v-text-field>

    <SearchResults
      v-if="showResults"
      :results="formattedResults"
      @result-click="handleResultClick"
      @close="showResults = false"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { eventBus } from '@/eventBus'

import SearchResults from './SearchResults.vue'

export default {
  components: { SearchResults },
  setup() {
    const searchQuery = ref('')
    const rawResults = ref([])
    const showResults = ref(false)
    const searchContainer = ref(null)
    const router = useRouter()

    // 将数组转换为按类型分组的对象
    const formattedResults = computed(() => {
      return {
        knowledge: rawResults.value.filter((item) => item.type === 'knowledge'),
        plan: rawResults.value.filter((item) => item.type === 'plan'),
        group: rawResults.value.filter((item) => item.type === 'group'),
      }
    })

    const mockSearch = async (query) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      return [
        {
          id: 1,
          type: 'knowledge',
          title: `${query} 相关结果`,
          excerpt: '这是模拟的搜索结果...',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          type: 'plan',
          title: `${query} 学习计划`,
          excerpt: '这是模拟的学习计划...',
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          type: 'group',
          title: `${query} 学习小组`,
          excerpt: '这是模拟的学习小组...',
          createdAt: new Date().toISOString(),
        },
      ]
    }

    const performSearch = async () => {
      if (searchQuery.value.trim()) {
        rawResults.value = await mockSearch(searchQuery.value)
        showResults.value = true
        console.log('Search results:', formattedResults.value) // 调试用
      }
    }

    const clearSearch = () => {
      searchQuery.value = ''
      rawResults.value = []
      showResults.value = false
    }

    const handleResultClick = (result) => {
      window.open(`/detail/${result.type}/${result.id}`, '_blank')
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
