<template>
  <!-- 建议本组件被放置在 App.vue 的 <v-main> 里，自动在左侧全局导航右边渲染 -->
  <v-container class="kgp-container" fluid>
    <v-row class="kgp-row g-3">

      <!-- 左列：标签索引 + 结构筛选（卡片组） -->
      <v-col class="kgp-col kgp-left d-flex flex-column gap-4" :cols="12" :md="3" :lg="3" :xl="3">
        <v-card class="kgp-card kgp-left-card card-stack" rounded="xl" elevation="2">
          <v-card-title class="text-body-1 py-3">标签索引</v-card-title>
          <v-divider class="my-0" :thickness="1" opacity="0.08"></v-divider>
          <v-card-text>
            <v-text-field
              v-model="tagSearch"
              density="comfortable"
              variant="outlined"
              hide-details
              clearable
              placeholder="搜索标签..."
              prepend-inner-icon="mdi-magnify"
            />
            <div class="d-flex flex-wrap gap-2 mt-2">
              <v-chip size="small" v-for="t in sampleChips" :key="t">{{ t }}</v-chip>
            </div>
          </v-card-text>
        </v-card>

        <v-card rounded="xl" elevation="2" class="kgp-card kgp-left-card card-stack">
          <v-card-title class="text-body-1 py-3">标签结构</v-card-title>
          <v-divider class="my-0" :thickness="1" opacity="0.08"></v-divider>
          <v-card-text class="pt-3">
            <!-- 用你的树形/筛选组件替换这里 -->
            <v-expansion-panels multiple variant="accordion" class="kgp-filter-group">
              <v-expansion-panel>
                <v-expansion-panel-title>学科分类体系</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-list density="compact" nav>
                    <v-list-item v-for="i in 8" :key="i" :title="`分类 ${i}`" />
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 中列：知识网络图 -->
      <v-col class="kgp-col kgp-center" :cols="12" :md="5" :lg="5" :xl="5">
        <v-card class="kgp-card kgp-center-card" elevation="2" rounded="xl">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-subtitle-1 font-weight-medium">知识网络</span>
            <div class="d-flex align-center ga-0">
              <template v-if="selectedNodes.length > 0">
                <v-tooltip :text="$t('knowledgeGraph.adjacentnodes')" location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn variant="text" icon class="mx-0" v-bind="props" @click="showAdjacentNodes">
                      <i class="fas fa-circle-nodes" />
                    </v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip :text="$t('knowledgeGraph.frontnodes')" location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn variant="text" icon class="mx-0" v-bind="props" @click="showPrerequisiteNodes">

                      <i class="fas fa-share-nodes" />
                    </v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip :text="$t('knowledgeGraph.backnodes')" location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn variant="text" icon class="mx-0" v-bind="props" @click="showSubsequentNodes">
                      <i class="fas fa-share-nodes" />
                    </v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip v-if="!isEditing" :text="isFavorited ? $t('knowledgeGraph.removenode') : $t('knowledgeGraph.savenode')" location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn variant="text" icon class="mx-0" v-bind="props" @click="toggleFavorites">
                      <i :class="isFavorited ? 'fas fa-heart-circle-minus' : 'fas fa-heart-circle-plus'" />
                    </v-btn>
                  </template>
                </v-tooltip>
              </template>

              <v-tooltip :text="$t('knowledgeGraph.saved')" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn variant="text" icon class="mx-0" v-bind="props" @click="showFavoritedNodes">
                    <i class="fas fa-star" />
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip :text="$t('knowledgeGraph.reset')" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn variant="text" icon class="mx-0" v-bind="props" @click="resetGraphView">
                    <i class="fas fa-arrows-rotate" />
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip :text="$t('edit')" location="top" v-if="!isEditing">
                <template v-slot:activator="{ props }">
                  <v-btn variant="text" icon class="mx-0" v-bind="props" @click="startGraphEditing">
                    <i class="fas fa-pen" />
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip :text="$t('canceledit')" location="top" v-if="isEditing">
                <template v-slot:activator="{ props }">
                  <v-btn variant="text" icon class="mx-0" v-bind="props" @click="submitGraphEditing">
                    <i class="fa-solid fa-right-from-bracket highlight-icon" />
                  </v-btn>
                </template>
              </v-tooltip>

              <v-btn size="small" variant="tonal" @click="refreshGraph">刷新</v-btn>
              <v-btn size="small" variant="text" icon="mdi-fullscreen" @click="enterFullscreen" />
            </div>
          </v-card-title>

          <v-divider class="my-1" />

          <v-card-text class="kgp-center-body">
            <!-- ✅ 单一容器：既是 ref 又是 knowledgegraph-container -->
            <div ref="graphWrap" class="kgp-graph-wrap knowledgegraph-container">
              <!-- ✅ 不再传 :height / :width / :key，由组件内部的 RO 负责 -->
              <KnowledgeNetwork ref="graph" class="kgp-graph" :zoom-level="zoomLevel" @ready="onGraphReady" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 右列：节点详情 / 创建表单 / 关系创建 -->
      <v-col class="kgp-col kgp-right" :cols="12" :md="4" :lg="4" :xl="4">
        <v-card class="kgp-card kgp-right-card" elevation="2" rounded="xl">
          <v-card-title class="text-subtitle-1 font-weight-medium">
            节点面板
          </v-card-title>
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
        <v-card-title class="py-3">标签</v-card-title>
        <v-divider class="my-0" :thickness="1" opacity="0.08"></v-divider>
        <v-card-text>
          <v-text-field v-model="tagSearch" density="comfortable" variant="outlined" hide-details clearable placeholder="搜索标签..." prepend-inner-icon="mdi-magnify"/>
          <v-list density="compact" nav class="mt-2">
            <v-list-item v-for="i in 12" :key="'m-'+i" :title="`标签 ${i}`" />
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
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import KnowledgeNetwork from '@/components/KnowledgeNetwork.vue'
import NodeInfo from '@/components/NodeInfo.vue'
import NodeCreationForm from '@/components/NodeCreationForm.vue'
import LinkCreationForm from '@/components/LinkCreationForm.vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { eventBus } from '@/eventBus'

const store = useStore()
const router = useRouter()

// 左列控件
const tagSearch = ref('')
const zoomLevel = ref('Field')
const zoomLevelItems = ['Keyword', 'Topic', 'Field', 'Subject']
const selectedTags = ref([])
const allTags = ref([])

const sampleChips = ref(['数学', '物理', '化学', '生物', '计算机科学', '人工智能', '数据科学', '机器学习'])
const leftDrawer = ref(false)
const rightDrawer = ref(false)

// 中心图尺寸控制
const graphWrap = ref(null)
const graph = ref(null)

// Safely call methods exposed from KnowledgeNetwork via the graph ref
function callGraphMethod(name) {
  const fn = graph.value?.[name]
  if (typeof fn === 'function') {
    fn()
  } else {
    console.warn(`KnowledgeNetwork method ${name} is not available`, graph.value)
  }
}

const showAdjacentNodes = () => callGraphMethod('showAdjacentNodes')
const showPrerequisiteNodes = () => callGraphMethod('showPrerequisiteNodes')
const showSubsequentNodes = () => callGraphMethod('showSubsequentNodes')
const toggleFavorites = () => callGraphMethod('toggleFavorites')
const showFavoritedNodes = () => callGraphMethod('showFavoritedNodes')
const resetGraphView = () => callGraphMethod('resetView')
const startGraphEditing = () => callGraphMethod('startEditing')
const submitGraphEditing = () => callGraphMethod('submitEditing')

// Exposed state from KnowledgeNetwork for actions in the title bar
const selectedNodes = computed(() => store.state.selectedNodes)
const isEditing = computed(() => store.state.isEditing)
const isFavorited = computed(() => graph.value?.isFavorited?.value || false)
const graphHeight = ref(480)
const graphWidth = ref(800)
const graphKey = ref(0)

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
  if (graph.value && typeof graph.value.reload === 'function') {
    graph.value.reload({ zoomLevel: zoomLevel.value, tags: selectedTags.value })
  } else {
    graphKey.value += 1
  }
}

function onGraphReady() {
  // 可选：图初始化完毕后的回调
}

function enterFullscreen() {
  // 如果你的图支持全屏 API，可在这里实现
}

function applyFilters() {
  if (graph.value && typeof graph.value.applyFilters === 'function') {
    graph.value.applyFilters({
      search: tagSearch.value,
      tags: selectedTags.value,
      zoomLevel: zoomLevel.value
    })
  }
}

function resetFilters() {
  tagSearch.value = ''
  selectedTags.value = []
  zoomLevel.value = 'Field'
  applyFilters()
}

function afterEditOrCreate() {
  refreshGraph()
}

function showFeed() {
  router.push({ name: 'allFeeds' })
}

onMounted(() => {
  eventBus.on('show-feed-section', showFeed)
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
  min-height: calc(100vh - 64px); /* 减去 footer 高度 */
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

.kgp-left-card {
  background-color: #F1E9D7;
  /* box-shadow: none !important; */
  padding: 16px;
}

.kgp-center-card {
  background-color: #FBF8F2;
  box-shadow: none !important;
  height: calc(100vh - var(--footer-vh, 6vh) - 72px);
  padding: 16px;
}

.kgp-right-card {
  background-color: #F1E9D7;
  /* box-shadow: none !important; */
  padding: 16px;
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

/* 左列表单小间距 */
.kgp-filter-group :deep(.v-field) {
  --v-input-control-height: 36px;
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
</style>
