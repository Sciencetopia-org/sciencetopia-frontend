<template>
  <GlobalLoader />
  <div ref="svgRef" id="cy" :class="{ 'fullscreen-mode': isFullScreen }"
    :style="{ width: width + 'px', height: height + 'px' }">
    <div v-if="inputVisible" class="search-flyin" @keydown.esc.stop.prevent="closeSearchPanel"
      @mousedown.stop @touchstart.stop @wheel.stop @click.stop="focusSearchInput">
      <svg-icon type="mdi" :path="path" class="search-flyin__icon" />
      <input ref="searchInput" v-model="searchQuery" type="text" :placeholder="$t('knowledgeGraph.locateto')"
        class="search-flyin__input" @keyup.enter.stop.prevent="handleSearch" @blur="handleBlur" />
      <button type="button" class="search-flyin__btn" @mousedown.stop @click.stop.prevent="handleSearch">
        <i class="fas fa-arrow-right" />
      </button>
      <button type="button" class="search-flyin__close" @mousedown.stop @click.stop.prevent="closeSearchPanel">
        <i class="fas fa-times" />
      </button>
    </div>

    <slot v-if="isFullScreen"></slot>
    <EditGuideDialog v-model="dialogVisible" @confirmed="confirmGuide"></EditGuideDialog>
    <ContextMenu :visible="contextMenuState.visible" :position="contextMenuState.position"
      @update:visible="contextMenuState.visible = $event" @close="hideContextMenu" />
  </div>
</template>

<script>
import useKnowledgeGraph from './useKnowledgeGraph'
import EditGuideDialog from './EditGuideDialog.vue'
import ContextMenu from '@/components/ui/ContextMenu.vue'
import { ref, computed, watch, nextTick } from 'vue'
import { apiClient } from '@/api'
import { useStore } from 'vuex'
import SvgIcon from '@jamescoyle/vue-icon'
import { mdiMapSearch } from '@mdi/js'

export default {
  name: 'KnowledgeNetwork',

  components: {
    SvgIcon,
    EditGuideDialog,
    ContextMenu,
  },

  setup(_, { expose }) {
    const store = useStore()
    const searchQuery = ref('')
    const inputVisible = ref(false)
    const searchInput = ref(null)
    const path = ref(mdiMapSearch)

    const dialogVisible = ref(false)

    const isFavoritedLoading = ref(false)
    const actionPending = ref(false)

    const withActionPending = async (fn, ...args) => {
      actionPending.value = true
      try {
        return await fn(...args)
      } finally {
        actionPending.value = false
      }
    }


    const {
      svgRef,
      selectedNodes,
      fetchData,
      loadGraphData,
      showAdjacentNodes,
      showPrerequisiteNodes,
      showSubsequentNodes,
      resetView,
      highlightAndCenterNode,
      searchNode,
      width,
      height,
      isFullScreen,
      toggleFullScreen,
      contextMenuState,
      hideContextMenu,
      showFavoritedNodes,
      beginLoading,
      endLoading,
    } = useKnowledgeGraph('/KnowledgeGraph/GetNodeInView')

    const isFavorited = ref(false)

    const fetchFavoriteStatus = async (nodeId) => {
      if (!nodeId) return
      try {
        isFavoritedLoading.value = true
        const response = await apiClient.get(`/KnowledgeGraph/Favorites/Status/${nodeId}`)
        const favorited = response?.data?.favorited
        isFavorited.value = typeof favorited === 'boolean' ? favorited : false
      }
      catch (error) {
        isFavorited.value = false
        const status = error?.response?.status
        if (status !== 400 && status !== 404) {
          console.error('Error fetching favorite status:', error)
        }
      } finally {
        isFavoritedLoading.value = false
      }
    }

    const toggleFavorites = async () => {
      if (!selectedNodes.value.length) return
      const nodeId = selectedNodes.value[0]?.id
      if (!nodeId) return
      isFavoritedLoading.value = true
      actionPending.value = true
      try {
        const response = await apiClient.post(`/KnowledgeGraph/Favorites/${nodeId}`)
        if (response?.data?.success === true && typeof response.data.favorited === 'boolean') {
          isFavorited.value = response.data.favorited
          // Immediately apply favorites overlay without reloading the graph
          await showFavoritedNodes()
          return { success: true, favorited: isFavorited.value }
        } else {
          await fetchFavoriteStatus(nodeId)
          await showFavoritedNodes()
          return { success: true, favorited: isFavorited.value }
        }
      } catch (error) {
        console.error('Error toggling favorite status:', error)
        await fetchFavoriteStatus(nodeId)
        // Still attempt to apply overlay with the latest server state
        try { await showFavoritedNodes() } catch (_) {}
        return { success: false, favorited: isFavorited.value, error }
      } finally {
        isFavoritedLoading.value = false
        actionPending.value = false
      }
    }

    // Fetch favorite status when a node is selected
    watch(selectedNodes, async (newVal) => {
      if (newVal && newVal.length > 0) {
        const nodeId = newVal[0]?.id
        await fetchFavoriteStatus(nodeId)
      } else {
        isFavorited.value = false
        isFavoritedLoading.value = false
      }
    })

    const closeSearchPanel = () => {
      inputVisible.value = false
      searchQuery.value = ''
    }

    const handleSearch = async () => {
      const query = searchQuery.value?.trim()
      if (!query) {
        closeSearchPanel()
        return
      }

      const foundNodeId = await searchNode(query)
      if (foundNodeId) {
        highlightAndCenterNode(foundNodeId, svgRef.value)
        closeSearchPanel()
      } else {
        console.warn('Node not found:', query)
        focusSearchInput()
      }
    }

    const handleBlur = () => {
      if (!searchQuery.value) {
        inputVisible.value = false
      }
    }

    const focusSearchInput = () => {
      nextTick(() => {
        searchInput.value?.focus()
      })
    }

    const openSearchPanel = () => {
      inputVisible.value = true
      focusSearchInput()
    }

    // Access Vuex state
    const isEditing = computed(() => store.state.isEditing)

    // Methods to interact with Vuex actions
    const toggleEditMode = () => {
      store.dispatch('toggleEditMode')
    }

    const startEditing = () => {
      dialogVisible.value = true // 用于控制对话框的显示
    }

    const confirmGuide = () => {
      // 用户确认指南后的逻辑
      dialogVisible.value = false
      toggleEditMode()
      // isEditing.value = true;
    }

    const submitEditing = () => {
      toggleEditMode()
      store.dispatch('toggleNodeCreationForm', false)
    }

    // Expose methods and state for external control from parent components
    expose({
      showAdjacentNodes,
      showPrerequisiteNodes,
      showSubsequentNodes,
      resetView,
      toggleFavorites,
      startEditing,
      submitEditing,
      showFavoritedNodes: () => withActionPending(showFavoritedNodes),
      selectedNodes,
      isFavorited,
      isFavoritedLoading,
      actionPending,
      isEditing,
      loadData: loadGraphData,
      toggleFullScreen,
      isFullScreen,
      openSearchPanel,
      closeSearchPanel,
      focusSearchInput,
      beginLoading,
      endLoading,
    })

    return {
      svgRef,
      selectedNodes,
      fetchData,
      handleSearch,
      searchQuery,
      inputVisible,
      searchInput,
      path,
      width,
      height,
      dialogVisible,
      startEditing,
      confirmGuide,
      submitEditing,
      isEditing,
      toggleEditMode,
      hideContextMenu,
      showFavoritedNodes,
      contextMenuState,
      isFavorited,
      toggleFullScreen,
      isFullScreen,
      openSearchPanel,
      closeSearchPanel,
      handleBlur,
      focusSearchInput,
      isFavoritedLoading,
      actionPending,
      beginLoading,
      endLoading,
    }
  },
}
</script>

<style scoped>
#cy {
  position: relative;
  overflow: visible;
}

#cy, #cy * {
  user-select: none;
  -webkit-user-drag: none;
}

#cy svg { touch-action: none; } /* 移动端/触摸板：禁用浏览器默认触摸平移缩放 */

/* 省略号容器（可选：用于整体淡入） */
.kg-ellipsis { 
  pointer-events: none; 
}

/* 三个点的“跳动 + 渐变”动画 */
.kg-ellipsis-dot {
  animation: kg-bounce 1.1s infinite ease-in-out, kg-fade 1.1s infinite ease-in-out;
  transform-origin: center;
}

@keyframes kg-bounce {
  0%, 80%, 100% { transform: translateY(0px) scale(1); }
  40%           { transform: translateY(-3px) scale(1.06); }
}
@keyframes kg-fade {
  0%, 80%, 100% { opacity: 0.25; }
  40%           { opacity: 0.9; }
}

.actions {
  transition: transform 0.1s linear;
  /* Smooth movement */
}

/* Node Actions Box */
.node-actions-box {
  position: absolute;
  top: 20vh;
  /* 修改右侧定位，考虑侧边栏宽度 */
  right: 120px;
  display: flex;
  gap: 10px;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin: 10px;
}

/* Common Actions Box (Saved, Reset, Edit) */
.common-actions-box {
  position: absolute;
  top: 40vh;
  /* 修改右侧定位，考虑侧边栏宽度 */
  right: 40px;
  display: flex;
  gap: 20px;
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 10px;
  justify-content: space-between;
  align-items: center;
  width: 200px;
}

/* Default Message Box */
.default-message-box {
  position: absolute;
  top: 60vh;
  /* 修改右侧定位，考虑侧边栏宽度 */
  right: 40px;
  padding: 16px;
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 200px;
  margin: 10px;
}

/* Search Fly-in */
.search-flyin {
  position: absolute;
  top: 18px;
  right: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  z-index: 1100;
  backdrop-filter: blur(4px);
  pointer-events: auto;
}

.search-flyin__icon {
  width: 18px;
  height: 18px;
  color: #757575;
}

.search-flyin__input {
  border: none;
  outline: none;
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  padding: 4px;
  min-width: 180px;
  font-size: 14px;
  user-select: text;
}

.search-flyin__input:focus {
  border-bottom-color: #ff8080;
}

.search-flyin__btn,
.search-flyin__close {
  border: none;
  background: transparent;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.search-flyin__btn:hover,
.search-flyin__close:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

/* Action Buttons */
.action-button {
  color: black;
  background-color: transparent;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  color: #ff8080;
  transform: scale(1.05);
}

.action-button:active {
  color: #ff4d4d;
}

/* Icons */
.action-icon {
  font-size: 18px;
}

.highlight-icon {
  color: red;
  font-size: 22px;
}

/* Fullscreen Mode */
.fullscreen-mode {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background-color: white;
  z-index: 9999 !important;
}
</style>
