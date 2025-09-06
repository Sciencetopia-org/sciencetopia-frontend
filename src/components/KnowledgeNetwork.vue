<template>
  <GlobalLoader />
  <div ref="svgRef" id="cy" :class="{ 'fullscreen-mode': isFullScreen }"
    :style="{ width: width + 'px', height: height + 'px' }">
    <!-- Bottom Right Actions -->
    <div class="bottom-right-actions">
      <div class="map-actions">
        <div @mouseover="(showInput(), (overContainer = true))"
          @mouseleave="() => { overContainer = false; hideInput(); }" class="action-container">
          <button @click="handleSearch" class="locator-btn">
            <svg-icon type="mdi" :path="path"></svg-icon>
          </button>
          <input v-if="inputVisible" v-model="searchQuery" type="text" :placeholder="$t('knowledgeGraph.locateto')"
            @input="handleInput" ref="searchInput" class="search-input" />
        </div>
      </div>

      <v-tooltip :text="isFullScreen
          ? $t('exitfullscreen')
          : $t('knowledgeGraph.fullscreen')
        " location="top">
        <template v-slot:activator="{ props }">
          <button class="fullscreen-button" v-bind="props" @click="toggleFullScreen">
            <i :class="isFullScreen ? 'fas fa-compress' : 'fas fa-expand'"></i>
          </button>
        </template>
      </v-tooltip>
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
import ContextMenu from './ContextMenu.vue'
import { ref, computed, watch } from 'vue'
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
    const inputContent = ref(false)
    const overContainer = ref(false)
    const path = ref(mdiMapSearch)

    const dialogVisible = ref(false)


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
    } = useKnowledgeGraph('/KnowledgeGraph/GetNodeInView')

    const isFavorited = ref(false)

    const toggleFavorites = async () => {
      try {
        // Assuming the first node in selectedNodes is the target
        const nodeId = selectedNodes.value[0].id
        const response = await apiClient.post(
          `/KnowledgeGraph/Favorites/${nodeId}`
        )

        if (response.data.success) {
          // Update isFavorited based on the toggled status from the response
          isFavorited.value = response.data.favorited

          // Show different alert messages based on the new favorite status
          if (isFavorited.value) {
            alert(this.$t('knowledgeGraph.favoriteAdded') || 'Node added to favorites successfully!')
          } else {
            alert(this.$t('knowledgeGraph.favoriteRemoved') || 'Node removed from favorites successfully!')
          }
        } else {
          alert(this.$t('knowledgeGraph.favoriteToggleFailed') || 'Failed to toggle favorite status.')
        }
      } catch (error) {
        console.error('Error toggling favorite status:', error)
      }
    }

    // Fetch favorite status when a node is selected
    watch(selectedNodes, async (newVal) => {
      if (newVal && newVal.length > 0) {
        try {
          const nodeId = newVal[0].id
          console.log(newVal[0].id)
          const response = await apiClient.get(
            `/KnowledgeGraph/Favorites/Status/${nodeId}`
          )
          isFavorited.value = response.data.favorited
          console.log(isFavorited)
        } catch (error) {
          console.error('Error fetching favorite status:', error)
        }
      }
    })

    const handleSearch = async () => {
      const foundNodeId = await searchNode(searchQuery.value)
      if (foundNodeId) {
        // `svgRef.value` should be the SVG element
        highlightAndCenterNode(foundNodeId, svgRef.value)
      } else {
        console.log('Node not found')
      }
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
      showFavoritedNodes,
      selectedNodes,
      isFavorited,
      isEditing,
      loadData: loadGraphData,
    })

    return {
      svgRef,
      selectedNodes,
      fetchData,
      handleSearch,
      searchQuery,
      inputVisible,
      inputContent,
      overContainer,
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
    }
  },

  methods: {
    showInput() {
      this.inputVisible = true
    },
    hideInput() {
      if (!this.overContainer && this.searchQuery.length === 0) {
        this.inputVisible = false
      }
    },
    handleInput() {
      this.inputContent = this.searchQuery.length > 0
      // 如果输入栏为空，并且鼠标不在按钮或输入栏上，隐藏输入栏
      if (
        this.searchQuery.length === 0 &&
        !this.overButton &&
        !this.overInput
      ) {
        this.inputVisible = false
      }
    },
  },
}
</script>

<style scoped>
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

/* Bottom Right Actions */
.bottom-right-actions {
  position: absolute;
  bottom: 5vh;
  /* 修改右侧定位，考虑侧边栏宽度 */
  right: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1000;
}

/* Map Actions */
.map-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Action Container */
.action-container {
  display: flex;
  align-items: center;
}

/* Locator Button */
.locator-btn {
  padding: 10px 15px;
  color: black;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
}

.locator-btn:hover,
.fullscreen-button:hover {
  color: #ff8080;
}

.locator-btn:active,
.fullscreen-button:active {
  color: #ff4d4d;
}

/* Fullscreen Button */
.fullscreen-button {
  padding: 10px 15px;
  color: black;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
}

/* Search Input */
.search-input {
  margin-left: 10px;
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  width: 150px;
  transition: width 0.3s ease;
}

.search-input:focus {
  border-color: #666;
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
