<template>
  <div v-if="normalizedType === 'resources'" class="result-item result-item--resource">
    <div class="result-item__toggle">
      <ResourceLearnToggle
        :resource="result"
        :disabled="!canToggleResources"
        @updated="onToggleUpdated"
        @toggle-failed="onToggleFailed"
      />
    </div>
    <button type="button" class="result-item__main" @click="$emit('click', result)">
      <div class="result-item__icon">
        <v-icon>{{ resultIcon }}</v-icon>
      </div>
      <div class="result-item__body">
        <div class="result-title">{{ result.title }}</div>
        <div class="result-excerpt">{{ result.excerpt }}</div>
        <div class="result-meta">
          <v-chip size="small" class="result-chip" variant="flat">{{ $t(`search.types.${normalizedType}`) }}</v-chip>
        </div>
      </div>
    </button>
  </div>
  <button v-else type="button" class="result-item" @click="$emit('click', result)">
    <div class="result-item__icon" :class="{ 'result-item__icon--knowledge-learned': isLearnedKnowledge }">
      <v-icon>{{ resultIcon }}</v-icon>
      <span v-if="isLearnedKnowledge" class="result-item__icon-badge">
        <v-icon size="10">mdi-check</v-icon>
      </span>
    </div>
    <div class="result-item__body">
      <div class="result-title">{{ result.title }}</div>
      <div class="result-excerpt">{{ result.excerpt }}</div>
      <div class="result-meta">
        <v-chip size="small" class="result-chip" variant="flat">{{ $t(`search.types.${normalizedType}`) }}</v-chip>
      </div>
    </div>
  </button>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import ResourceLearnToggle from '@/components/resources/ResourceLearnToggle.vue'

export default {
  components: { ResourceLearnToggle },
  props: {
    result: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const store = useStore()
    const normalizedType = computed(() => {
      const map = {
        KnowledgeBase: 'knowledge',
        Resources: 'resources',
        StudyGroups: 'group',
      }
      return map[props.result.type] || props.result.type
    })

    const resultIcon = computed(() => {
      if (normalizedType.value === 'knowledge') return props.result.learned ? 'mdi-graph' : 'mdi-graph-outline'
      if (normalizedType.value === 'resources') return 'mdi-book-open-page-variant-outline'
      if (normalizedType.value === 'group') return 'mdi-account-group-outline'
      return 'mdi-file-document-outline'
    })
    const isLearnedKnowledge = computed(() => normalizedType.value === 'knowledge' && props.result.learned === true)

    const canToggleResources = computed(() => Boolean(store.state.currentUserID || store.state.userInfo?.id))

    const onToggleUpdated = (event) => {
      props.result.learned = event?.completed === true
    }

    const onToggleFailed = (event) => {
      props.result.learned = event?.completed === true
      if (event?.error) console.error('Failed to toggle search resource completion', event.error)
    }

    return { normalizedType, resultIcon, isLearnedKnowledge, canToggleResources, onToggleUpdated, onToggleFailed }
  }
}
</script>

<style scoped>
.result-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 14px 16px;
  border: 1px solid transparent;
  border-bottom-color: rgba(197, 159, 89, 0.16);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}

.result-item--resource {
  align-items: stretch;
  gap: 10px;
}

.result-item:hover {
  background: rgba(255, 255, 255, 0.76);
  border-color: rgba(48, 78, 117, 0.16);
  border-radius: 18px;
  transform: translateY(-1px);
}

.result-item__main {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
}

.result-item__toggle {
  display: inline-flex;
  align-items: flex-start;
  padding-top: 16px;
  padding-left: 2px;
}

.result-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: rgba(48, 78, 117, 0.1);
  color: #304e75;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.result-item__icon--knowledge-learned {
  background: rgba(223, 203, 164, 0.88);
  border: 1px solid rgba(197, 159, 89, 0.65);
}

.result-item__icon-badge {
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #304e75;
  color: #fbf8f2;
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 3px 8px rgba(48, 78, 117, 0.2);
}

.result-item__body {
  min-width: 0;
  flex: 1 1 auto;
}

.result-title {
  font-weight: 600;
  color: #304e75;
  margin-bottom: 6px;
}

.result-excerpt {
  color: rgba(48, 78, 117, 0.74);
  font-size: 0.93rem;
  line-height: 1.45;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-meta {
  display: flex;
  justify-content: flex-start;
}

.result-chip {
  background: rgba(226, 180, 60, 0.18) !important;
  color: #304e75 !important;
  border: 1px solid rgba(197, 159, 89, 0.26);
}

@media (max-width: 720px) {
  .result-item {
    gap: 12px;
    padding: 12px 10px 14px;
  }

  .result-item__main {
    gap: 12px;
  }

  .result-item__icon {
    width: 36px;
    height: 36px;
    flex-basis: 36px;
  }
}
</style>
