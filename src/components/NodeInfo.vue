<template>
  <div>
    <v-skeleton-loader v-if="loading" type="article, actions" class="mb-2" />
    <template v-if="!loading">
      <div v-for="(node, index) in detailedSelectedNodes" :key="index">
        <v-card-title>{{ node.name }}</v-card-title>

        <!-- 描述：允许换行；避免 node.description 为空时报错 -->
        <v-card-text v-if="node.description" v-html="sanitizeDescription(node.description)"></v-card-text>
        <v-card-text v-else class="text-grey">
          {{ $t('knowledgeGraph.noDescription') || 'No description.' }}
        </v-card-text>

        <!-- 资源列表（注意你的返回是数组对象：resource.link） -->
        <div v-if="filteredOutCount(node) > 0" class="mb-2">
          <v-btn variant="text" density="comfortable" @click="toggleHidden(node)" :prepend-icon="isExpanded(node) ? 'mdi-eye-off-outline' : 'mdi-eye-outline'">
            {{ $t('knowledgeGraph.regionFiltered', { count: filteredOutCount(node) }) || `部分资源因地区限制未显示（${filteredOutCount(node)}）` }}
          </v-btn>
        </div>
        <v-card-item v-for="(resource, i) in filteredResources(node)" :key="i" class="link-preview-container">
          <LinkPreview :url="resource.link || resource" />
        </v-card-item>
        <template v-if="isExpanded(node) && hiddenResources(node).length">
          <v-divider class="my-2" />
          <div class="text-caption text-medium-emphasis mb-1">{{ $t('knowledgeGraph.filteredTitle') || '被隐藏的资源（可能在中国大陆无法访问）' }}</div>
          <v-card-item v-for="(resource, i) in hiddenResources(node)" :key="'hidden-' + i" class="link-preview-container">
            <LinkPreview :url="resource.link || resource" />
          </v-card-item>
        </template>
      </div>
    </template>
    <div v-if="detailedSelectedNodes.length === 0 && !loading" class="pb-6">
      <v-card-text style="color: grey">
        {{ $t('knowledgeGraph.defaultmessage') }}
      </v-card-text>
    </div>
  </div>
</template>

<script>
import { computed, reactive } from 'vue'
import { useSelectedNodeDetails } from '@/composables/useSelectedNodeDetails'
import LinkPreview from '@/components/LinkPreview.vue'
import { isMainlandChina } from '@/utils/region'
import { isAccessibleInChina } from '@/utils/resourceFilter'

export default {
  name: 'NodeInfo',
  components: {
    LinkPreview,
  },
  setup() {
    const { detailedSelectedNodes, loading, error } = useSelectedNodeDetails({ revalidate: true })
    const state = { isCN: false }
    isMainlandChina().then(v => state.isCN = !!v).catch(() => { state.isCN = false })
    const filteredResources = (node) => {
      const list = Array.isArray(node?.resources) ? node.resources : []
      if (!state.isCN) return list
      return list.filter(r => isAccessibleInChina(r?.link || r))
    }
    const filteredOutCount = (node) => {
      const list = Array.isArray(node?.resources) ? node.resources : []
      return Math.max(0, list.length - filteredResources(node).length)
    }
    const hiddenResources = (node) => {
      if (!state.isCN) return []
      const list = Array.isArray(node?.resources) ? node.resources : []
      return list.filter(r => !isAccessibleInChina(r?.link || r))
    }
    const expanded = reactive({})
    const keyOf = (node) => (node && (node.id || node.name)) || ''
    const isExpanded = (node) => !!expanded[keyOf(node)]
    const toggleHidden = (node) => { const k = keyOf(node); expanded[k] = !expanded[k] }
    const sanitizeDescription = (desc) => {
      try { return String(desc || '').replace(/\r?\n/g, '<br>') } catch { return '' }
    }
    return { detailedSelectedNodes, loading, error, filteredResources, filteredOutCount, hiddenResources, isExpanded, toggleHidden, sanitizeDescription }
  },
}
</script>

<style scoped>
@import '../assets/css/link-preview.css';
</style>








