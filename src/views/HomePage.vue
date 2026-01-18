<template>
  <!-- 建议本组件被放置在 App.vue 的 <v-main> 里，自动在左侧全局导航右边渲染 -->
  <v-container class="kgp-container" fluid>
    <v-row class="kgp-row g-3">

      <!-- 左列：标签索引 + 结构筛选（卡片组） -->
      <v-col class="kgp-col kgp-left d-flex flex-column gap-4" :cols="12" :md="3" :lg="3" :xl="3">
        <v-card class="kgp-card card-stack panel-card panel-card--beige" rounded="xl" elevation="2">
          <v-card-title class="text-body-1 py-3">{{ $t('home.tagsIndex') }}</v-card-title>
          <v-divider class="my-0" :thickness="1" opacity="0.08"></v-divider>
          <v-card-text>
            <!-- 仅筛选时显示的细进度条 -->
            <v-progress-linear v-show="filterLoading" indeterminate absolute color="primary" height="2"
              class="card-top-loader" />
            <v-autocomplete :key="acKey" v-model="tagSearch" v-model:search="tagSearchQuery" v-model:menu="tagMenuOpen"
              :items="tagSuggestions" density="comfortable" variant="outlined" hide-details clearable
              :placeholder="$t('home.searchTagsPlaceholder')" prepend-inner-icon="" :loading="tagLoading" @update:search="onTagSearch"
              @update:menu="onTagMenuChange" @update:modelValue="addTag" @click:prepend-inner="filterByTags">
              <!-- 用 slot 自定义放大镜：点击筛选且可显示 loading 动效 -->
              <template #prepend-inner>
                <v-btn icon size="small" variant="text" :loading="filterLoading" :disabled="filterLoading"
                  @click.stop="filterByTags" :aria-label="$t('home.filterSelectedAria')">
                  <v-icon v-if="!filterLoading">mdi-magnify</v-icon>
                </v-btn>
              </template>
            </v-autocomplete>
            <div class="d-flex flex-wrap gap-2 mt-2">
              <v-chip size="small" v-for="t in selectedTags" :key="t" closable @click:close="removeTag(t)">{{ t
              }}</v-chip>
            </div>
          </v-card-text>
        </v-card>

        <v-card rounded="xl" elevation="2" class="kgp-card card-stack panel-card panel-card--beige">
          <v-card-title class="text-body-1 py-3">{{ $t('home.tagsStructure') }}</v-card-title>
          <v-divider class="my-0" :thickness="1" opacity="0.08"></v-divider>
          <v-card-text class="pt-3" style="position: relative;">
            <v-progress-linear v-show="filterTagStructureLoading" indeterminate absolute color="primary" height="2"
              class="card-top-loader" />
            <v-list class="kgp-filter-group plan-list" nav>
              <v-list-item class="group-plan-item plan-card kgp-list-item" v-for="(sys, i) in tagSystems" :key="sys" :title="sys"
                :active="activeTagSystem === i" :disabled="filterTagStructureLoading && loadingTagSystemIndex === i"
                @click="selectTagSystem(i)" />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 中列：知识网络图 -->
      <v-col class="kgp-col kgp-center" :cols="12" :md="5" :lg="5" :xl="5">
        <v-card class="kgp-card panel-card panel-card--cream" elevation="2" rounded="xl">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-subtitle-1 font-weight-medium">{{ $t('home.knowledgeNetwork') }}</span>
            <div class="d-flex align-center ga-0">
              <template v-if="selectedNodes.length > 0">
                <v-tooltip v-if="!isEditing"
                  :text="isFavorited ? $t('knowledgeGraph.removenode') : $t('knowledgeGraph.savenode')" location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn variant="text" icon class="mx-0" v-bind="props" @click="onToggleFavorites"
                      :disabled="graphActionPending || isFavoritedLoading" :loading="isFavoritedLoading">
                      <i :class="isFavorited ? 'fas fa-heart-circle-minus' : 'fas fa-heart-circle-plus'" />
                      <!-- <span class="ml-1">
                        {{ isFavorited ? $t('knowledgeGraph.removenode') : $t('knowledgeGraph.savenode') }}
                      </span> -->
                    </v-btn>
                  </template>
                </v-tooltip>
              </template>

              <v-tooltip :text="$t('knowledgeGraph.saved')" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn variant="text" icon class="mx-0" v-bind="props" @click="showFavoritedNodes"
                    :disabled="graphActionPending">
                    <i class="fas fa-star" />
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip :text="$t('knowledgeGraph.reset')" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn variant="text" icon class="mx-0" v-bind="props" @click="resetGraphView"
                    :disabled="graphActionPending">
                    <i class="fas fa-arrows-rotate" />
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip :text="$t('edit')" location="top" v-if="!isEditing">
                <template v-slot:activator="{ props }">
                  <v-btn variant="text" icon class="mx-0" v-bind="props" @click="startGraphEditing"
                    :disabled="graphActionPending">
                    <i class="fas fa-pen" />
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip :text="$t('canceledit')" location="top" v-if="isEditing">
                <template v-slot:activator="{ props }">
                  <v-btn variant="text" icon class="mx-0" v-bind="props" @click="submitGraphEditing"
                    :disabled="graphActionPending">
                    <i class="fa-solid fa-right-from-bracket highlight-icon" />
                  </v-btn>
                </template>
              </v-tooltip>
              <v-tooltip :text="$t('knowledgeGraph.locateto')" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn variant="text" icon class="mx-0" v-bind="props" @click="openGraphSearch"
                    :disabled="graphActionPending">
                    <v-icon>mdi-map-search</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip :text="isFullScreen ? $t('exitfullscreen') : $t('knowledgeGraph.fullscreen')" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn variant="text" icon class="mx-0" v-bind="props" @click="enterFullscreen"
                    :disabled="graphActionPending">
                    <i :class="isFullScreen ? 'fas fa-compress' : 'fas fa-expand'" />
                  </v-btn>
                </template>
              </v-tooltip>
            </div>
          </v-card-title>

          <v-divider class="my-1" />

          <v-card-text class="kgp-center-body">
            <!-- ✅ 单一容器：既是 ref 又是 knowledgegraph-container -->
            <div ref="graphWrap"
              :class="['kgp-graph-wrap knowledgegraph-container', { 'kgp-graph-wrap--fullscreen': isFullScreen }]">
              <!-- ✅ 不再传 :height / :width / :key，由组件内部的 RO 负责 -->
              <KnowledgeNetwork ref="graph" class="kgp-graph" :zoom-level="zoomLevel" @ready="onGraphReady" />
              <div v-if="isFullScreen" class="kgp-fullscreen-panel"
                @mousedown.stop @touchstart.stop @wheel.stop
                :class="{ 'kgp-fullscreen-panel--collapsed': fullscreenPanelCollapsed }">
                <button type="button" class="kgp-fullscreen-panel__toggle" @click.stop="toggleFullscreenPanel"
                  :aria-label="fullscreenPanelCollapsed ? $t('knowledgeGraph.showPanel') : $t('knowledgeGraph.hidePanel')">
                  <i :class="fullscreenPanelCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right'" />
                </button>
                <transition name="fade">
                  <div v-if="!fullscreenPanelCollapsed" class="kgp-fullscreen-panel__content">
                    <div class="kgp-fullscreen-panel__header">
                      <span>{{ $t('home.nodePanel') }}</span>
                      <button type="button" class="kgp-fullscreen-panel__close" @click.stop="toggleFullscreenPanel">
                        <i class="fas fa-times" />
                      </button>
                    </div>
                    <div class="kgp-fullscreen-panel__body">
                      <NodeCreationForm v-if="$store.state.displayNodeCreationForm" @submitted="afterEditOrCreate" />
                      <LinkCreationForm v-else-if="$store.state.displayLinkCreationForm" @submitted="afterEditOrCreate" />
                      <NodeInfo v-else @edited="afterEditOrCreate" />
                    </div>
                  </div>
                </transition>
              </div>
              <div v-if="graphEmptyMessage" class="kgp-empty-overlay">
                <i class="fas fa-circle-info kgp-empty-icon"></i>
                <span>{{ graphEmptyMessage }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 右列：节点详情 / 创建表单 / 关系创建 -->
      <v-col v-if="!isFullScreen" class="kgp-col kgp-right" :cols="12" :md="4" :lg="4" :xl="4">
        <v-card class="kgp-card panel-card panel-card--beige" elevation="2" rounded="xl">
          <v-card-title class="text-subtitle-1 font-weight-medium">{{ $t('home.nodePanel') }}</v-card-title>
          <v-card-text class="pt-0">
            <NodeCreationForm v-if="$store.state.displayNodeCreationForm" @submitted="afterEditOrCreate" />
            <LinkCreationForm v-else-if="$store.state.displayLinkCreationForm" @submitted="afterEditOrCreate" />
            <NodeInfo v-else @edited="afterEditOrCreate" />
          </v-card-text>
        </v-card>
      </v-col>

    </v-row>

    <!-- 移动端：左侧抽屉（卡片风格内容简化版） -->
    <v-navigation-drawer v-model="leftDrawer" temporary location="start" width="320" class="d-md-none">
      <v-card flat>
        <v-card-title class="py-3">{{ $t('home.tags') }}</v-card-title>
        <v-divider class="my-0" :thickness="1" opacity="0.08"></v-divider>
        <v-card-text>
          <v-text-field v-model="tagSearch" density="comfortable" variant="outlined" hide-details clearable
            :placeholder="$t('home.searchTagsPlaceholder')" prepend-inner-icon="mdi-magnify" />
          <v-list density="compact" nav class="mt-2">
            <v-list-item v-for="i in 12" :key="'m-' + i" :title="`${$t('home.tag')} ${i}`" />
          </v-list>
        </v-card-text>
      </v-card>
    </v-navigation-drawer>

    <!-- 移动端：右侧抽屉（复用右栏模块） -->
    <v-navigation-drawer v-model="rightDrawer" temporary location="end" width="380" class="d-md-none">
      <v-card flat>
        <v-card-title class="py-3">{{ rightPanelTitle }}</v-card-title>
        <v-divider class="my-0" :thickness="1" opacity="0.08"></v-divider>
        <v-card-text class="pt-3">
          <v-slide-y-transition mode="out-in">
            <component :is="currentRightComponent" :key="currentRightKey + '-m'" />
          </v-slide-y-transition>
        </v-card-text>
      </v-card>
    </v-navigation-drawer>
  </v-container>
  <v-snackbar v-model="snackOpen" timeout="2200">{{ snackText }}</v-snackbar>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue'
import KnowledgeNetwork from '@/components/knowledge/KnowledgeNetwork.vue'
import NodeInfo from '@/components/knowledge/NodeInfo.vue'
import NodeCreationForm from '@/components/knowledge/NodeCreationForm.vue'
import LinkCreationForm from '@/components/knowledge/LinkCreationForm.vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { eventBus } from '@/eventBus'
import { apiClient } from '@/api'
import { useI18n } from 'vue-i18n'

const store = useStore()
const router = useRouter()
const { t } = useI18n()

// 左列控件
const acKey = ref(0)
const tagSearch = ref(null)
const tagSearchQuery = ref('')
const tagSuggestions = ref([])
const tagMenuOpen = ref(false)
const tagLoading = ref(false)
const selectedTags = ref([])
const tagSystems = ref([])
const activeTagSystem = ref()
const selectedTagSystem = ref('')
const loadingTagSystemIndex = ref(null)
const zoomLevel = ref('Field')
const leftDrawer = ref(false)
const rightDrawer = ref(false)

// 中心图尺寸控制
const graphWrap = ref(null)
const graph = ref(null)

const snackOpen = ref(false)
const snackText = ref('')

// Safely call methods exposed from KnowledgeNetwork via the graph ref
function callGraphMethod(name) {
  const fn = graph.value?.[name]
  if (typeof fn === 'function') {
    return fn()
  } else {
    console.warn(`KnowledgeNetwork method ${name} is not available`, graph.value)
  }
}

const toggleFavorites = () => callGraphMethod('toggleFavorites')
const showFavoritedNodes = () => callGraphMethod('showFavoritedNodes')
const resetGraphView = () => callGraphMethod('resetView')
const startGraphEditing = () => callGraphMethod('startEditing')
const submitGraphEditing = () => callGraphMethod('submitEditing')

async function onToggleFavorites() {
  try {
    const result = await callGraphMethod('toggleFavorites')
    if (result && result.success === true) {
      snackText.value = result.favorited ? t('favoriteAdded') : t('favoriteRemoved')
    } else {
      snackText.value = t('favoriteToggleFailed')
    }
  } catch (e) {
    snackText.value = t('favoriteToggleFailed')
  } finally {
    snackOpen.value = true
  }
}

// Exposed state from KnowledgeNetwork for actions in the title bar
const selectedNodes = computed(() => store.state.selectedNodes)
const isEditing = computed(() => store.state.isEditing)
const isFavorited = computed(() => graph.value?.isFavorited?.value || false)
const isFavoritedLoading = computed(() => graph.value?.isFavoritedLoading?.value || false)
const graphActionPending = computed(() => graph.value?.actionPending?.value || false)
const graphHeight = ref(480)
const graphWidth = ref(800)
const graphKey = ref(0)

const filterLoading = ref(false)     // ← 标签筛选（搜索）加载态
const filterTagStructureLoading = ref(false) // ← 标签结构切换加载态
const MIN_SPIN = 300                 // 可选：最少展示 300ms，避免闪一下
const graphEmptyMessage = ref('')
const isFullScreen = computed(() => graph.value?.isFullScreen?.value || false)
const fullscreenPanelCollapsed = ref(false)

watch(isFullScreen, (val) => {
  if (!val) {
    fullscreenPanelCollapsed.value = false
  }
})

function toggleFullscreenPanel() {
  fullscreenPanelCollapsed.value = !fullscreenPanelCollapsed.value
}

function onTagMenuChange(open) {
  // 打开且没有输入时，不展示旧下拉
  if (open && !tagSearchQuery.value) {
    tagSuggestions.value = []
  }
}

function onTagSearch(val) {
  tagSearchQuery.value = val
  if (!val) {
    tagSuggestions.value = []
    return
  }
  tagLoading.value = true
  apiClient
    .get('/KnowledgeGraph/SearchTagNames', { params: { query: val } })
    .then(res => {
      const body = res && 'data' in res ? res.data : res
      tagSuggestions.value = body?.data ? body.data : body
    })
    .catch(e => console.error(e))
    .finally(() => {
      tagLoading.value = false
    })
}

function addTag(val) {
  if (val && !selectedTags.value.includes(val)) {
    selectedTags.value.push(val)
  }
  /// 关键：下一轮 tick 再清空，避免被组件内部同步写回覆盖
  nextTick(() => {
    tagSearch.value = null           // 清掉选择值
    tagSearchQuery.value = ''        // 清掉输入文字
    tagMenuOpen.value = false        //（可选）收起下拉
    tagSuggestions.value = []  // 防止再次自动填充
    acKey.value += 1                 // 重置 autocomplete 组件状态
  })
}

function removeTag(t) {
  selectedTags.value = selectedTags.value.filter(tag => tag !== t)
}

function applyGraphData(data, { emptyMessageKey = 'home.emptyGraph', emptyMessageParams } = {}) {
  const payload = data || { nodes: [], links: [] }
  if (graph.value && typeof graph.value.loadData === 'function') {
    graph.value.loadData(payload)
  }

  const nodes = Array.isArray(payload?.nodes) ? payload.nodes : []
  const links = Array.isArray(payload?.links) ? payload.links : []
  graphEmptyMessage.value = (nodes.length > 0 || links.length > 0)
    ? ''
    : t(emptyMessageKey, emptyMessageParams)
}

async function loadGraphBySystem() {
  const tagSystemParam = selectedTagSystem.value || ''
  const displayName = tagSystemParam || t('home.tagsStructure')
  graphEmptyMessage.value = ''
  await nextTick()
  graph.value?.beginLoading?.()

  try {
    const res = await apiClient.get('/KnowledgeGraph/GetNodeInView', {
      params: { tagSystem: tagSystemParam }
    })
    const data = res?.data?.data ?? res?.data
    applyGraphData(data, {
      emptyMessageKey: 'home.emptyGraphStructure',
      emptyMessageParams: { name: displayName }
    })
    return data
  } catch (error) {
    console.error('GetNodeInView failed:', error?.response?.status, error?.response?.data || error)
    graphEmptyMessage.value = t('operationfailedmsg3')
    throw error
  } finally {
    graph.value?.endLoading?.()
  }
}

async function fetchGraphByTags(tags) {
  const endpoint = '/KnowledgeGraph/FilterByTags'
  const tagSystemParam = selectedTagSystem.value || ''

  const attempt = async (params, extraConfig = {}) => {
    const res = await apiClient.get(endpoint, {
      params: { tagSystem: tagSystemParam, ...params },
      ...extraConfig
    })
    return res?.data?.data ?? res?.data
  }

  try {
    return await attempt({ tags }, { paramsSerializer: { indexes: null } })
  } catch (error) {
    if (error?.response?.status !== 400) throw error
    try {
      return await attempt({ tags: tags.join(',') })
    } catch (errorCsv) {
      if (errorCsv?.response?.status !== 400) throw errorCsv
      return await attempt({ tagNames: tags }, { paramsSerializer: { indexes: null } })
    }
  }
}

async function filterByTags() {
  const tags = (selectedTags.value || []).filter(Boolean)
  if (!selectedTagSystem.value && tags.length === 0) {
    graphEmptyMessage.value = ''
    return null
  }

  if (tags.length === 0) {
    return loadGraphBySystem()
  }

  await nextTick()
  graph.value?.beginLoading?.()
  filterLoading.value = true
  const start = Date.now()
  graphEmptyMessage.value = ''

  try {
    const data = await fetchGraphByTags(tags)
    applyGraphData(data, { emptyMessageKey: 'home.emptyGraphFilter' })
    return data
  } catch (error) {
    console.error('FilterByTags failed:', error?.response?.status, error?.response?.data || error)
    graphEmptyMessage.value = t('operationfailedmsg3')
    throw error
  } finally {
    const elapsed = Date.now() - start
    setTimeout(() => { filterLoading.value = false }, Math.max(0, MIN_SPIN - elapsed))
    graph.value?.endLoading?.()
  }
}

async function fetchTagSystems() {
  try {
    const res = await apiClient.get('/KnowledgeGraph/GetTagSystems')
    const body = res && 'data' in res ? res.data : res
    const payload = body?.data ? body.data : body
    tagSystems.value = payload
    if (payload && payload.length > 0) {
      await applyTagSystem(0, { initial: true })
    }
  } catch (e) {
    console.error(e)
  }
}

async function applyTagSystem(idx, { initial = false } = {}) {
  const target = tagSystems.value[idx]
  if (!target) return
  if (!initial && filterTagStructureLoading.value && loadingTagSystemIndex.value === idx) return

  activeTagSystem.value = idx
  selectedTagSystem.value = target

  const start = Date.now()

  if (!initial) {
    filterTagStructureLoading.value = true
    loadingTagSystemIndex.value = idx
  }

  try {
    await filterByTags()
  } finally {
    if (!initial) {
      const elapsed = Date.now() - start
      setTimeout(() => {
        if (loadingTagSystemIndex.value === idx) {
          loadingTagSystemIndex.value = null
        }
        filterTagStructureLoading.value = false
      }, Math.max(0, MIN_SPIN - elapsed))
    }
  }
}

function selectTagSystem(idx) {
  applyTagSystem(idx).catch(err => console.error(err))
}

let rafId = 0
function scheduleMeasure() {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(measureGraph)
}

function measureGraph() {
  const wrap = graphWrap.value
  if (!wrap) return

  const rect = wrap.getBoundingClientRect()
  const vh = window.innerHeight

  // 计算目标宽高：给一点最小尺寸避免 0
  const desiredW = Math.max(320, Math.floor(wrap.clientWidth))
  const desiredH = Math.max(320, Math.floor(vh - rect.top - 24)) // 留 24px 卡片内边距

  // 仅当变化时才更新，避免触发不必要的重绘和观察器回调
  const wChanged = graphWidth.value !== desiredW
  const hChanged = graphHeight.value !== desiredH
  if (wChanged || hChanged) {
    graphWidth.value = desiredW
    graphHeight.value = desiredH

    // 优先调用子组件的 resize，如果没有则退回 key 触发重渲染
    nextTick(() => {
      if (graph.value && typeof graph.value.resize === 'function') {
        graph.value.resize({ width: desiredW, height: desiredH })
      } else {
        graphKey.value += 1
      }
    })
  }
}

function onWindowResize() {
  scheduleMeasure()
}

function refreshGraph() {
  filterByTags().catch(err => console.error(err))
}


function onGraphReady() {
  // 可选：图初始化完毕后的回调
}

function enterFullscreen() {
  const fn = graph.value?.toggleFullScreen
  if (typeof fn === 'function') {
    fn()
  }
}

function openGraphSearch() {
  const fn = graph.value?.openSearchPanel
  if (typeof fn === 'function') {
    fn()
  }
}


function afterEditOrCreate() {
  refreshGraph()
}

function showFeed() {
  router.push({ name: 'allFeeds' })
}

onMounted(() => {
  eventBus.on('show-feed-section', showFeed)
  fetchTagSystems()
  // 初次与延迟测量：避免 0×0
  scheduleMeasure()
  setTimeout(scheduleMeasure, 60)
  setTimeout(scheduleMeasure, 200)
  window.addEventListener('resize', onWindowResize)
})

onBeforeUnmount(() => {
  eventBus.off('show-feed-section', showFeed)
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', onWindowResize)
})
</script>

<style scoped>
/* 容器贴合 v-main，内容在左侧导航右边（由 Vuetify 布局控制） */
.kgp-container {
  padding: 10px;
  /* width: calc(100% - 10px); */
}

/* 行满高布局，列内各卡片使用 sticky 以在滚动时固定标题 */
.kgp-row {
  min-height: calc(100vh - 64px);
  /* 减去 footer 高度 */
  /* gap: 12px; */
}

/* 三列更“瘦身”的宽度倾向（大屏）；中间列自适应 */
/* .kgp-left {
  flex: 0 0 280px;
  max-width: 320px;
}

.kgp-right {
  flex: 0 0 360px;
  max-width: 400px;
}

.kgp-center {
  min-width: 480px;
} */

/* 卡片统一风格（无分割线分栏，只用卡片做模块） */
.kgp-card {
  position: sticky;
  top: 12px;
  /* 固定高度 */
  display: flex;
  flex-direction: column;
}

.kgp-center .panel-card {
  height: calc(100vh - var(--footer-vh, 6vh) - 72px);
}

.kgp-center-body {
  flex: 1 1 auto;
  padding: 0 12px 12px;
  display: flex;
  overflow: hidden;
}

.kgp-graph-wrap.knowledgegraph-container {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  /* 关键 */
}

.kgp-graph-wrap--fullscreen {
  overflow: visible;
}

.kgp-graph {
  width: 100%;
  height: 100%;
}

/* （可选）把 svg/canvas 绝对定位，进一步与父容器解耦 */
.kgp-graph-wrap :deep(svg),
.kgp-graph-wrap :deep(canvas) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.kgp-fullscreen-panel {
  position: absolute;
  top: 24px;
  right: 24px;
  max-width: min(360px, 42vw);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  z-index: 1200;
  pointer-events: auto;
}

.kgp-fullscreen-panel--collapsed .kgp-fullscreen-panel__content {
  display: none;
}

.kgp-fullscreen-panel__toggle {
  border: none;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transition: background-color 0.2s ease;
}

.kgp-fullscreen-panel__toggle:hover {
  background: rgba(0, 0, 0, 0.8);
}

.kgp-fullscreen-panel__content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(6px);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  padding: 16px;
  width: 100%;
  max-height: min(80vh, 720px);
  overflow-y: auto;
}

.kgp-fullscreen-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 15px;
}

.kgp-fullscreen-panel__close {
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.kgp-fullscreen-panel__close:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

.kgp-fullscreen-panel__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.kgp-empty-overlay {
  position: absolute;
  inset: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 18px 22px;
  border-radius: 16px;
  border: 1px dashed rgba(0, 0, 0, 0.12);
  background-color: rgba(255, 255, 255, 0.88);
  color: #4f4f4f;
  font-size: 15px;
  line-height: 1.5;
  pointer-events: none;
  backdrop-filter: blur(2px);
}

.kgp-empty-icon {
  margin-right: 8px;
  font-size: 20px;
  color: #6c6c6c;
}

/* 左列表单小间距 */
.kgp-filter-group :deep(.v-field) {
  --v-input-control-height: 36px;
}

.kgp-list-item {
  border-radius: 0px !important;
}

/* 响应式处理：窄屏时堆叠三列，并放松最小宽度限制 */
@media (max-width: 1264px) {

  .kgp-left,
  .kgp-right {
    max-width: none;
    flex-basis: auto;
  }

  .kgp-center {
    min-width: auto;
  }

  .kgp-card {
    position: static;
    /* 小屏不 sticky，避免遮挡 */
    max-height: none;
  }
}

.highlight-icon {
  color: red;
  font-size: 22px;
}

.card-top-loader {
  left: 0;
  right: 0;
  top: 0;
  z-index: 2;
}
</style>

