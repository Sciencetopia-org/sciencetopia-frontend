<template>
  <div class="search-results-wrapper" ref="resultsWrapper">
    <div class="search-results">
      <v-tabs v-model="activeTab" grow class="search-results__tabs" slider-color="transparent">
        <v-tab
          v-for="tab in tabs"
          :key="tab.value"
          :value="tab.value"
          class="search-results__tab"
          :disabled="!results[tab.value]?.length"
        >
          <span class="search-results__tab-label">{{ $t(`search.tabs.${tab.value}`) }}</span>
          <span class="search-results__tab-count">{{ results[tab.value]?.length || 0 }}</span>
        </v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="search-results__window">
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
              <v-btn v-if="hasMore" @click="loadMore" text>{{ $t('search.loadMore') }}</v-btn>
            </div>
          </template>
          <div v-else class="no-results">
            {{ $t('search.noResults') }}
          </div>
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
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
        resources: [],
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
      { value: 'knowledge' },
      { value: 'resources' },
      { value: 'group' }
    ]

    watch(
      () => props.results,
      (nextResults) => {
        const firstAvailableTab = tabs.find(tab => (nextResults?.[tab.value]?.length || 0) > 0)?.value || tabs[0].value
        if (!(nextResults?.[activeTab.value]?.length || 0)) {
          activeTab.value = firstAvailableTab
        }
      },
      { deep: true, immediate: true }
    )

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
.search-results-wrapper {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  margin-top: 12px;
}

.search-results {
  position: relative;
  background: #f1e9d7;
  border-radius: 24px;
  border: 1px solid rgba(197, 159, 89, 0.34);
  box-shadow:
    0 18px 40px rgba(48, 78, 117, 0.12),
    0 6px 16px rgba(48, 78, 117, 0.06);
  max-height: min(70vh, 720px);
  overflow-y: auto;
  padding: 12px;
}

.search-results::before {
  display: none;
}

.search-results__tabs {
  position: relative;
  z-index: 1;
  padding: 4px;
  border-radius: 999px;
  background: rgba(223, 203, 164, 0.54);
}

.search-results__tabs :deep(.v-slide-group__content) {
  gap: 6px;
}

.search-results__tab {
  min-height: 42px;
  border-radius: 999px;
  text-transform: none;
  letter-spacing: 0;
  color: #304e75;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.search-results__tabs :deep(.v-tab--selected) {
  background: #304e75;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(48, 78, 117, 0.18);
}

.search-results__tab-label {
  font-weight: 600;
}

.search-results__tab-count {
  margin-left: 6px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(226, 180, 60, 0.2);
  color: inherit;
  font-size: 0.78rem;
  line-height: 20px;
}

.search-results__window {
  position: relative;
  z-index: 1;
  margin-top: 10px;
}

.no-results {
  padding: 28px 16px 24px;
  text-align: center;
  color: rgba(48, 78, 117, 0.68);
}

.pagination-controls {
  display: flex;
  justify-content: center;
  padding: 14px 12px 10px;
}

.pagination-controls :deep(.v-btn) {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #304e75;
  border: 1px solid rgba(197, 159, 89, 0.3);
}

.search-results__tabs :deep(.v-tab--disabled) {
  opacity: 0.42;
}

@media (max-width: 720px) {
  .search-results {
    border-radius: 20px;
    padding: 10px;
  }

  .search-results__tab {
    min-height: 38px;
    font-size: 0.92rem;
  }
}
</style>
