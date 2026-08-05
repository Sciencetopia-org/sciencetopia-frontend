<template>
  <div>
    <v-skeleton-loader v-if="loading" type="article, actions" class="mb-2" />
    <template v-if="!loading">
      <div v-for="(node, index) in detailedSelectedNodes" :key="index">
        <v-card-title>{{ node.name }}</v-card-title>

        <!-- 描述：允许换行；避免 node.description 为空时报错 -->
        <v-card-text v-if="node.description">
          <span v-html="sanitizeDescription(node.description)"></span>
        </v-card-text>
        <v-card-text v-else class="text-grey">
          {{ $t('knowledgeGraph.noDescription') || 'No description.' }}
        </v-card-text>

        <!-- 资源列表（注意你的返回是数组对象：resource.link） -->
        <div v-if="filteredOutCount(node) > 0" class="mb-2">
          <v-btn variant="text" density="comfortable" @click="toggleHidden(node)" :prepend-icon="isExpanded(node) ? 'mdi-eye-off-outline' : 'mdi-eye-outline'">
            {{ $t('knowledgeGraph.regionFiltered', { count: filteredOutCount(node) }) || `部分资源因地区限制未显示（${filteredOutCount(node)}）` }}
          </v-btn>
        </div>
        <v-card-item v-for="(resource, i) in filteredResources(node)" :key="resource.id || resource.link || i" class="link-preview-container">
          <div class="node-resource-row">
            <ResourceLearnToggle
              class="node-resource-row__toggle"
              :resource="resource"
              :disabled="!canToggleResources"
              @updated="onResourceUpdated(node, resource, $event)"
              @toggle-failed="onResourceToggleFailed(node, resource, $event)"
            />
            <div class="node-resource-row__preview">
              <LinkPreview :url="resource.link || resource" />
            </div>
          </div>
        </v-card-item>
        <template v-if="isExpanded(node) && hiddenResources(node).length">
          <v-divider class="my-2" />
          <div class="text-caption text-medium-emphasis mb-1">{{ $t('knowledgeGraph.filteredTitle') || '被隐藏的资源（可能在中国大陆无法访问）' }}</div>
          <v-card-item v-for="(resource, i) in hiddenResources(node)" :key="'hidden-' + (resource.id || resource.link || i)" class="link-preview-container">
            <div class="node-resource-row">
              <ResourceLearnToggle
                class="node-resource-row__toggle"
                :resource="resource"
                :disabled="!canToggleResources"
                @updated="onResourceUpdated(node, resource, $event)"
                @toggle-failed="onResourceToggleFailed(node, resource, $event)"
              />
              <div class="node-resource-row__preview">
                <LinkPreview :url="resource.link || resource" />
              </div>
            </div>
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
import { useStore } from 'vuex'
import { useSelectedNodeDetails } from '@/composables/useSelectedNodeDetails'
import { useNodeDetailsCache } from '@/composables/useNodeDetailsCache'
import LinkPreview from '@/components/knowledge/LinkPreview.vue'
import ResourceLearnToggle from '@/components/resources/ResourceLearnToggle.vue'
import { isMainlandChina } from '@/utils/region'
import { isAccessibleInChina } from '@/utils/resourceFilter'
import { textWithLineBreaks } from '@/utils/text'

export default {
  name: 'NodeInfo',
  emits: ['edited', 'node-state-changed'],
  components: {
    LinkPreview,
    ResourceLearnToggle,
  },
  setup(_, { emit }) {
    const store = useStore()
    const { detailedSelectedNodes, loading, error } = useSelectedNodeDetails({ revalidate: true })
    const { primeNode } = useNodeDetailsCache()
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
    const sanitizeDescription = (desc) => textWithLineBreaks(desc)
    const canToggleResources = computed(() => Boolean(store.state.currentUserID || store.state.userInfo?.id))
    const syncNodeCache = (node) => {
      if (!node?.id) return
      primeNode(node.id, {
        id: node.id,
        name: node.name,
        description: node.description,
        resources: Array.isArray(node.resources) ? node.resources : [],
        tags: Array.isArray(node.tags) ? node.tags : [],
        createdDate: node.createdDate,
        updatedDate: node.updatedDate,
      })
    }
    const updateResourceState = (node, targetResource, completed) => {
      const list = Array.isArray(node?.resources) ? node.resources : []
      list.forEach(resource => {
        const sameId = resource?.id && targetResource?.id && String(resource.id) === String(targetResource.id)
        const sameLink = !sameId && resource?.link && targetResource?.link && resource.link === targetResource.link
        if (sameId || sameLink) resource.learned = completed
      })
      syncNodeCache(node)
    }
    const onResourceUpdated = (node, resource, event) => {
      updateResourceState(node, resource, event?.completed === true)
      if (event?.phase === 'confirmed') {
        emit('node-state-changed', {
          nodeId: node?.id,
          resourceId: resource?.id,
          completed: event?.completed === true,
        })
      }
    }
    const onResourceToggleFailed = (node, resource, event) => {
      updateResourceState(node, resource, event?.completed === true)
      emit('node-state-changed', {
        nodeId: node?.id,
        resourceId: resource?.id,
        completed: event?.completed === true,
        failed: true,
      })
      if (event?.error) console.error('Failed to toggle node resource completion', event.error)
    }
    return {
      detailedSelectedNodes,
      loading,
      error,
      filteredResources,
      filteredOutCount,
      hiddenResources,
      isExpanded,
      toggleHidden,
      sanitizeDescription,
      canToggleResources,
      onResourceUpdated,
      onResourceToggleFailed,
    }
  },
}
</script>

<style scoped>
@import '../../assets/css/link-preview.css';

.node-resource-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.node-resource-row__toggle {
  margin-top: 10px;
}

.node-resource-row__preview {
  flex: 1 1 auto;
  min-width: 0;
}
</style>









