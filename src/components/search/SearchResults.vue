<template>
  <div class="search-results-wrapper" ref="resultsWrapper">
    <div class="search-results">
      <v-tabs v-model="activeTab" grow>
        <v-tab 
          v-for="tab in tabs" 
          :key="tab.value" 
          :value="tab.value"
          :disabled="!results[tab.value]?.length"
        >
          {{ tab.label }} ({{ results[tab.value]?.length || 0 }})
        </v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <v-window-item 
          v-for="tab in tabs" 
          :key="tab.value" 
          :value="tab.value"
        >
          <template v-if="results[tab.value]?.length">
            <SearchResultItem
              v-for="result in results[tab.value]"
              :key="`${result.type}-${result.id}`"
              :result="result"
              @click="$emit('result-click', result)"
            />
            <div class="pagination-controls">
              <v-btn v-if="hasMore" @click="loadMore" text>Load More</v-btn>
            </div>
          </template>
          <div v-else class="no-results">
            未找到匹配内容
          </div>
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import SearchResultItem from './SearchResultItem.vue'

export default {
  components: { SearchResultItem },
  props: {
    results: {
      type: Object,
      required: true,
      default: () => ({
        knowledge: [],
        plan: [],
        group: []
      })
    },
    hasMore: {
      type: Boolean,
      default: false
    }
  },
  emits: ['result-click', 'close', 'load-more'],
  setup(props, { emit }) {
    const activeTab = ref('knowledge')
    const resultsWrapper = ref(null)
    
    // 确保与 SearchBar.vue 中的类型一致
    const tabs = [
      { value: 'knowledge', label: 'Knowledge Base' },
      { value: 'plan', label: 'Study Plans' },
      { value: 'group', label: 'Study Groups' }
    ]

    const loadMore = () => {
      emit('load-more', activeTab.value)
    }

    onClickOutside(resultsWrapper, (event) => {
      // 排除搜索框的点击
      const searchInput = document.querySelector('.search-bar-container input')
      if (!searchInput?.contains(event.target)) {
        emit('close')
      }
    })

    return {
      activeTab,
      tabs,
      loadMore,
      resultsWrapper
    }
  }
}
</script>

<style scoped>
/* 保持原有样式不变 */
.search-results-wrapper {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  margin-top: 8px;
}

.search-results {
  background: white;
  border-radius: 4px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
  max-height: 70vh;
  overflow-y: auto;
}

.no-results {
  padding: 16px;
  text-align: center;
  color: rgba(0, 0, 0, 0.6);
}

.pagination-controls {
  display: flex;
  justify-content: center;
  padding: 12px;
}

/* 禁用状态的标签样式 */
.v-tab--disabled {
  opacity: 0.6;
}
</style>