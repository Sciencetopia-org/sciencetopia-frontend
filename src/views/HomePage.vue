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
          <v-card-text class="pt-3">
            <v-list class="kgp-filter-group plan-list" nav>
              <v-list-item class="group-plan-item plan-card kgp-list-item" v-for="(sys, i) in tagSystems" :key="sys" :title="sys" :active="activeTagSystem === i"
                @click="activeTagSystem = i"/>
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

                <v-tooltip v-if="!isEditing"
                  :text="isFavorited ? $t('knowledgeGraph.removenode') : $t('knowledgeGraph.savenode')" location="top">
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
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue'
import KnowledgeNetwork from '@/components/KnowledgeNetwork.vue'
import NodeInfo from '@/components/NodeInfo.vue'
import NodeCreationForm from '@/components/NodeCreationForm.vue'
import LinkCreationForm from '@/components/LinkCreationForm.vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { eventBus } from '@/eventBus'
import { apiClient } from '@/api'

const store = useStore()
const router = useRouter()

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
const zoomLevel = ref('Field')
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

const filterLoading = ref(false)     // ← 新增：仅用于“筛选”加载态
const MIN_SPIN = 300                 // 可选：最少展示 300ms，避免闪一下

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

async function filterByTags() {
  // ① 没选标签就不要打请求（很多后端会 400）
  if (!selectedTags.value || selectedTags.value.length === 0) {
    // 可选：初次加载/清空时走你的默认加载逻辑
    if (graph.value?.reload) {
      graph.value.reload({ zoomLevel: zoomLevel.value, tags: [] })
    }
    return
  }

  filterLoading.value = true;
  const start = Date.now();

  // axios v1: 用 paramsSerializer.indexes=null 生成 tags=a&tags=b（无 []）
  const base = {
    tagSystem: selectedTagSystem.value || '',
    tags: selectedTags.value
  }

  try {
    const res = await apiClient.get('/KnowledgeGraph/FilterByTags', {
      params: base,
      paramsSerializer: { indexes: null }  // ✅ 关键：数组不带方括号
    })
    const data = res?.data?.data ?? res?.data
    graph.value?.loadData(data)
  } catch (e1) {
    // ② 回退1：后端可能期望 CSV：tags=a,b
    if (e1?.response?.status === 400) {
      try {
        const res2 = await apiClient.get('/KnowledgeGraph/FilterByTags', {
          params: {
            tagSystem: selectedTagSystem.value || '',
            tags: selectedTags.value.join(',')   // ✅ CSV 形式
          }
        })
        const data2 = res2?.data?.data ?? res2?.data
        graph.value?.loadData(data2)
        return
      } catch (e2) {
        // ③ 回退2：有些接口参数名叫 tagNames
        try {
          const res3 = await apiClient.get('/KnowledgeGraph/FilterByTags', {
            params: { tagSystem: selectedTagSystem.value || '', tagNames: selectedTags.value },
            paramsSerializer: { indexes: null }
          })
          const data3 = res3?.data?.data ?? res3?.data
          graph.value?.loadData(data3)
          return
        } catch (e3) {
          console.error('FilterByTags failed (fallbacks exhausted):',
            e3?.response?.status, e3?.response?.data || e3)
        }
      }
    } else {
      console.error('FilterByTags failed:', e1?.response?.status, e1?.response?.data || e1)
    }
  } finally {
    const elapsed = Date.now() - start
    setTimeout(() => { filterLoading.value = false }, Math.max(0, MIN_SPIN - elapsed))
  }
}

async function fetchTagSystems() {
  try {
    const res = await apiClient.get('/KnowledgeGraph/GetTagSystems')
    const body = res && 'data' in res ? res.data : res
    const payload = body?.data ? body.data : body
    tagSystems.value = payload
    if (payload && payload.length > 0) {
      activeTagSystem.value = 0
      selectedTagSystem.value = payload[0]
    }
  } catch (e) {
    console.error(e)
  }
}

watch(activeTagSystem, (idx) => {
  if (tagSystems.value[idx]) {
    selectedTagSystem.value = tagSystems.value[idx]
    filterByTags()
  }
})

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


function afterEditOrCreate() {
  refreshGraph()
}

function showFeed() {
  router.push({ name: 'allFeeds' })
}

onMounted(() => {
  eventBus.on('show-feed-section', showFeed)
  fetchTagSystems().then(() => {
    filterByTags()
  })
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
