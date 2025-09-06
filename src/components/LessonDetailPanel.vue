<template>
  <v-card class="panel-card panel-card--beige pa-4 lesson-detail-panel" rounded="xl" elevation="2">
    <div v-if="!current">
      <div class="placeholder">{{ $t('lessonDetail.selectLesson') }}</div>
    </div>
    <div v-else>
      <h3 class="mb-2">{{ displayName }}</h3>
      <p class="text-body-2 mb-3">{{ displayDescription }}</p>
      <!-- Loading skeletons for resource list while fetching -->
      <div v-if="loadingLesson">
        <v-skeleton-loader type="list-item-two-line" class="mb-2" />
        <v-skeleton-loader type="list-item-two-line" class="mb-2" />
        <v-skeleton-loader type="list-item-two-line" class="mb-2" />
      </div>
      <div v-else-if="current.resources && current.resources.length">
        <v-card-item v-for="(resource, idx) in current.resources" :key="idx" class="link-preview-container">
          <LinkPreview :url="resource.link || resource.url" />
          <div class="d-flex align-center mt-1">
            <v-checkbox
              v-model="resource.learned"
              :disabled="!isInteractable"
              hide-details
              density="compact"
              @click.stop="toggleResource(resource)"
              :label="resource.learned ? $t('lessonDetail.completed') : $t('lessonDetail.notCompleted')"
            />
          </div>
        </v-card-item>
      </div>
      <div v-else-if="resourcesLoaded" class="text-medium-emphasis text-caption">{{ $t('lessonDetail.noResources') }}</div>
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
    return { current: this.lesson, loadingLesson: false, resourcesLoaded: false }
  },
  watch: {
    lesson: {
      immediate: true,
      async handler(lesson) {
        const needFetch = this.planId && this.lessonId && (!lesson || !Array.isArray(lesson.resources) || lesson.resources.length === 0)
        if (needFetch) {
          // Avoid flicker: start loading first and set header from incoming lesson
          this.loadingLesson = true
          this.resourcesLoaded = false
          if (lesson) this.current = lesson
          await this.fetchLessonById()
          return
        }
        this.current = lesson
        this.resourcesLoaded = true
        if (lesson) this.fetchLessonCompletedStatus(lesson)
      },
    },
    lessonId: {
      immediate: true,
      async handler(id) {
        if (!id || !this.planId) return
        const hasResources = Array.isArray(this.current?.resources) && this.current.resources.length > 0
        const sameId = String(this.current?.id || this.current?.name || '') === String(id)
        if (!sameId || !hasResources) {
          this.loadingLesson = true
          this.resourcesLoaded = false
          await this.fetchLessonById()
        }
      },
    },
  },
  methods: {
    async fetchLessonById() {
      try {
        // loadingLesson is set by callers to avoid flicker
        if (!this.loadingLesson) this.loadingLesson = true
        this.resourcesLoaded = false
        const lid = encodeURIComponent(this.lessonId)
        const res = await apiClient.get(`/StudyPlans/${this.planId}/Lessons/${lid}`)
        const lesson = res?.data?.lesson || res?.data
        if (lesson) {
          this.current = lesson
          await this.fetchLessonCompletedStatus(lesson)
        }
      } catch (_) { /* ignore */ }
      finally { this.loadingLesson = false; this.resourcesLoaded = true }
    },
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
    displayName() {
      const l = this.current || {}
      return l.name || l.title || l.lessonName || ''
    },
    displayDescription() {
      const l = this.current || {}
      return l.description || l.summary || l.desc || ''
    },
  },
}
</script>

<style scoped>
@import '../assets/css/link-preview.css';
.placeholder { color: #999; text-align: center; width: 100%; margin-top: 20px; }
</style>
