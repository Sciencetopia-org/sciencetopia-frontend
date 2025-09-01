<template>
  <v-card class="panel-card panel-card--beige pa-4 lesson-detail-panel" rounded="xl" elevation="2">
    <div v-if="!current">
      <div class="placeholder">请选择一个课程</div>
    </div>
    <div v-else>
      <h3 class="mb-2">{{ current.name }}</h3>
      <p class="text-body-2 mb-3">{{ current.description }}</p>
      <div v-if="current.resources && current.resources.length">
        <v-card-item v-for="(resource, idx) in current.resources" :key="idx" class="link-preview-container">
          <LinkPreview :url="resource.link || resource.url" />
          <div class="d-flex align-center mt-1">
            <v-checkbox
              v-model="resource.learned"
              :disabled="!isInteractable"
              hide-details
              density="compact"
              @click.stop="toggleResource(resource)"
              :label="resource.learned ? '已完成' : '未完成'"
            />
          </div>
        </v-card-item>
      </div>
      <div v-else class="text-medium-emphasis text-caption">暂无资源</div>
    </div>
  </v-card>
</template>

<script>
import { apiClient } from '@/api'
import LinkPreview from '@/components/LinkPreview.vue'

export default {
  name: 'LessonDetailPanel',
  components: { LinkPreview },
  props: {
    planId: { type: [String, Number], required: false },
    lessonId: { type: [String, Number, String], default: null },
    lesson: { type: Object, default: null },
    scope: { type: Object, default: () => ({ type: 'me' }) },
    canInteract: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['resource-updated'],
  data() {
    return { current: this.lesson }
  },
  watch: {
    lesson: {
      immediate: true,
      handler(lesson) {
        this.current = lesson
        if (lesson) this.fetchLessonCompletedStatus(lesson)
      },
    },
    lessonId: {
      immediate: true,
      async handler(id) {
        if (!this.lesson && id && this.planId) {
          await this.resolveLessonFromPlan()
        }
      },
    },
  },
  methods: {
    mergeLessons(lessons) {
      if (!Array.isArray(lessons)) return []
      const map = new Map()
      lessons.forEach((lesson) => {
        const key = lesson?.id || lesson?.name
        if (!key) return
        const existing = map.get(String(key))
        const resources = Array.isArray(lesson.resources) ? lesson.resources : []
        if (existing) {
          existing.resources = existing.resources.concat(resources)
        } else {
          map.set(String(key), { ...lesson, resources: [...resources] })
        }
      })
      return Array.from(map.values())
    },
    async resolveLessonFromPlan() {
      try {
        const res = await apiClient.get('/StudyPlan/GetStudyPlanById', { params: { studyPlanId: this.planId } })
        const plan = res?.data?.studyPlan || res?.data
        if (!plan) return
        const secs = ['prerequisite','mainCurriculum','advancedTopics']
        for (const s of secs) {
          const arr = this.mergeLessons(plan[s] || [])
          const found = arr.find(l => String(l.id||l.name) === String(this.lessonId))
          if (found) { this.current = found; await this.fetchLessonCompletedStatus(found); return }
        }
      } catch (_) {}
    },
    async fetchLessonCompletedStatus(lesson) {
      try {
        if (!lesson?.resources || lesson.resources.length === 0) return
        const ids = lesson.resources.map((r) => r.id || r.resourceId).filter(Boolean)
        if (!ids.length) return
        const res = await apiClient.post('/resources/completedStatus', { resourceIds: ids })
        const statusList = Array.isArray(res.data) ? res.data : []
        const map = new Map(statusList.map((s) => [String(s.resourceId), !!s.completed]))
        lesson.resources.forEach((r) => { const key = String(r.id || r.resourceId); if (map.has(key)) r.learned = map.get(key) })
      } catch (e) {
        // ignore
      }
    },
    async toggleResource(resource) {
      try {
        if (!this.isInteractable) return
        const next = !resource.learned
        // optimistic update
        resource.learned = next
        this.$emit('resource-updated', { completed: next, resource })
        const id = resource.id || resource.resourceId
        if (id) {
          if (next) {
            await apiClient.post(`/resources/${id}/complete`, {
              planId: this.planId,
              lessonId: this.current?.id,
              source: 'checkbox',
              device: 'web',
            })
          } else {
            await apiClient.delete(`/resources/${id}/complete`, { params: { planId: this.planId } })
          }
        } else {
          await apiClient.post('/StudyPlan/LearningLessons/ToggleFinishedLearning', {
            name: this.current?.name,
            resourceLink: resource.link,
          })
        }
      } catch (e) {
        // rollback
        resource.learned = !resource.learned
        this.$emit('resource-updated', { completed: resource.learned, resource, error: e })
      }
    },
  },
  computed: {
    isInteractable() { return !!this.canInteract && !this.disabled },
  },
}
</script>

<style scoped>
@import '../assets/css/link-preview.css';
.placeholder { color: #999; text-align: center; width: 100%; margin-top: 20px; }
</style>
