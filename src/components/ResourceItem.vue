<template>
  <v-list-item>
    <template #prepend>
      <v-checkbox
        :model-value="completed"
        :disabled="disabled"
        @click.stop="toggle"
        :aria-label="`完成 ${displayTitle}`"
      />
    </template>
    <v-list-item-title>
      <a :href="link" target="_blank" rel="noopener noreferrer">{{ displayTitle }}</a>
    </v-list-item-title>
  </v-list-item>
</template>

<script>
import { apiClient } from '@/api'

export default {
  name: 'ResourceItem',
  props: {
    resource: { type: Object, required: true },
    planId: { type: [String, Number], required: false },
    lessonId: { type: [String, Number, String], required: false },
    disabled: { type: Boolean, default: false },
    lessonName: { type: String, default: '' },
  },
  data() {
    return {
      busy: false,
      localCompleted: this.resource.learned === true,
    }
  },
  computed: {
    id() {
      return this.resource.id || this.resource.resourceId || null
    },
    link() {
      return this.resource.link || this.resource.url || '#'
    },
    displayTitle() {
      return this.resource.title || this.link
    },
    completed() {
      return this.localCompleted
    },
  },
  methods: {
    async toggle() {
      if (this.busy) return
      const next = !this.localCompleted
      // optimistic update
      this.localCompleted = next
      this.$emit('update', { completed: next, resource: this.resource })
      try {
        if (this.id) {
          if (next) {
            await apiClient.post(`/resources/${this.id}/complete`, {
              planId: this.planId,
              lessonId: this.lessonId,
              source: 'checkbox',
              device: 'web',
            })
          } else {
            await apiClient.delete(`/resources/${this.id}/complete`, {
              params: { planId: this.planId },
            })
          }
        } else {
          // fallback legacy link-based toggle if no id is available
          await apiClient.post('/StudyPlan/LearningLessons/ToggleFinishedLearning', {
            name: this.lessonName || undefined,
            resourceLink: this.link,
          })
        }
      } catch (e) {
        console.error('Toggle resource completion failed', e)
        // rollback
        this.localCompleted = !next
        this.$emit('update', { completed: !next, resource: this.resource, error: e })
      } finally {
        this.busy = false
      }
    },
  },
}
</script>
