<template>
  <div class="lesson-detail-panel">
    <div v-if="!lesson">
      <div class="placeholder">请选择一个课程</div>
    </div>
    <div v-else>
      <h3 class="mb-2">{{ lesson.name }}</h3>
      <p>{{ lesson.description }}</p>
      <v-list v-if="lesson.resources && lesson.resources.length">
        <ResourceItem
          v-for="(res, idx) in lesson.resources"
          :key="idx"
          :resource="res"
          :planId="planId"
          :lessonId="lesson?.id"
          :lessonName="lesson?.name"
          :disabled="disabled"
          @update="(p) => $emit('resource-updated', p)"
        />
      </v-list>
    </div>
  </div>
</template>

<script>
import { apiClient } from '@/api'
import ResourceItem from '@/components/ResourceItem.vue'

export default {
  name: 'LessonDetailPanel',
  components: { ResourceItem },
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
    async resolveLessonFromPlan() {
      try {
        const res = await apiClient.get('/StudyPlan/GetStudyPlanById', { params: { studyPlanId: this.planId } })
        const plan = res?.data?.studyPlan || res?.data
        if (!plan) return
        const secs = ['prerequisite','mainCurriculum','advancedTopics']
        for (const s of secs) {
          const arr = plan[s] || []
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
  },
}
</script>

<style scoped>
.placeholder { color: #999; text-align: center; width: 100%; margin-top: 20px; }
</style>
