<template>
  <button
    type="button"
    class="resource-learn-toggle"
    :class="{
      'resource-learn-toggle--checked': localCompleted,
      'resource-learn-toggle--busy': busy,
    }"
    :disabled="isDisabled"
    :aria-label="localCompleted ? $t('lessonDetail.completed') : $t('lessonDetail.notCompleted')"
    :title="localCompleted ? $t('lessonDetail.completed') : $t('lessonDetail.notCompleted')"
    @click.stop.prevent="toggle"
  >
    <v-progress-circular
      v-if="busy"
      indeterminate
      :size="12"
      :width="2"
      color="primary"
    />
    <v-icon v-else-if="localCompleted" size="14">mdi-check</v-icon>
  </button>
</template>

<script>
import { apiClient } from '@/api'
import { getResourceId } from '@/utils/resourceProgress'
import { launchCompletionConfetti } from '@/utils/confetti'

export default {
  name: 'ResourceLearnToggle',
  props: {
    resource: { type: Object, required: true },
    planId: { type: [String, Number], default: null },
    lessonId: { type: [String, Number], default: null },
    disabled: { type: Boolean, default: false },
    allowLegacyLinkFallback: { type: Boolean, default: true },
  },
  emits: ['updated', 'toggle-failed'],
  data() {
    return {
      busy: false,
      localCompleted: this.resource?.learned === true,
    }
  },
  computed: {
    isDisabled() {
      return this.disabled || this.busy
    },
    resourceId() {
      return getResourceId(this.resource)
    },
    resourceLink() {
      return this.resource?.link || this.resource?.url || this.resource?.properties?.link || null
    },
  },
  watch: {
    'resource.learned': {
      immediate: false,
      handler(value) {
        this.localCompleted = value === true
      },
    },
  },
  methods: {
    normalizeContextId(value) {
      if (value === null || value === undefined || value === '') return undefined
      return String(value)
    },
    async toggle() {
      if (this.isDisabled) return

      const next = !this.localCompleted
      const previous = this.localCompleted
      this.localCompleted = next
      this.busy = true
      this.$emit('updated', { completed: next, resource: this.resource, phase: 'optimistic' })

      try {
        let response = null
        const planId = this.normalizeContextId(this.planId)
        const lessonId = this.normalizeContextId(this.lessonId)

        if (this.resourceId) {
          if (next) {
            response = await apiClient.post(`/resources/${this.resourceId}/complete`, {
              planId,
              lessonId,
              resourceLink: this.resourceLink,
              source: 'resource-toggle',
              device: 'web',
            })
          } else {
            const params = {}
            if (planId) params.planId = planId
            if (lessonId) params.lessonId = lessonId
            if (this.resourceLink) params.resourceLink = this.resourceLink
            response = await apiClient.delete(`/resources/${this.resourceId}/complete`, { params })
          }
        } else if (this.allowLegacyLinkFallback && this.resourceLink) {
          await apiClient.post('/StudyPlan/LearningLessons/ToggleFinishedLearning', {
            link: this.resourceLink,
            source: 'resource-toggle',
            device: 'web',
          })
        } else {
          throw new Error('Resource id is required to toggle learning status.')
        }

        if (!previous && next) {
          launchCompletionConfetti()
        }

        this.$emit('updated', {
          completed: next,
          resource: this.resource,
          phase: 'confirmed',
          response: response?.data,
        })
      } catch (error) {
        this.localCompleted = previous
        this.$emit('toggle-failed', { completed: previous, resource: this.resource, error })
      } finally {
        this.busy = false
      }
    },
  },
}
</script>

<style scoped>
.resource-learn-toggle {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(197, 159, 89, 0.9);
  background: #fbf8f2;
  color: #304e75;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 20px;
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.resource-learn-toggle:hover:not(:disabled) {
  border-color: #304e75;
  background: #f1e9d7;
}

.resource-learn-toggle--checked {
  background: #dfcba4;
  border-color: #c59f59;
  color: #304e75;
}

.resource-learn-toggle:disabled {
  opacity: 0.72;
  cursor: default;
}
</style>
