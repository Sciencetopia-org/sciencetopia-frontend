<template>
  <v-card class="panel-card panel-card--beige pa-4 lesson-detail-panel" rounded="xl" elevation="2">
    <div v-if="!current">
      <div class="placeholder">{{ $t('lessonDetail.selectLesson') }}</div>
    </div>
    <div v-else>
      <h3 class="mb-2">{{ displayName }}</h3>
      <p class="text-body-2 mb-3">{{ displayDescription }}</p>
      <!-- Lesson tags chips -->
      <TagChips v-if="Array.isArray(current?.tags) && current.tags.length" :items="current.tags" class="mb-3" />
      <!-- Associated Knowledge Nodes -->
      <div v-if="Array.isArray(current?.associatedKnowledgeNodes) && current.associatedKnowledgeNodes.length" class="mb-4">
        <div class="text-subtitle-2 mb-1">相关知识点</div>
        <div class="d-flex flex-wrap">
          <v-chip
            v-for="(n, idx) in current.associatedKnowledgeNodes"
            :key="n?.properties?.id || n?.elementId || idx"
            class="ma-1"
            label
            size="small"
          >
            {{ nodeTitle(n) }}
          </v-chip>
        </div>
      </div>
      <!-- Loading skeletons for resource list while fetching -->
      <div v-if="loadingLesson">
        <v-skeleton-loader type="list-item-two-line" class="mb-2" />
        <v-skeleton-loader type="list-item-two-line" class="mb-2" />
        <v-skeleton-loader type="list-item-two-line" class="mb-2" />
      </div>
      <div v-else-if="filteredResources && filteredResources.length">
        <div v-if="filteredOutCount > 0" class="mb-2">
          <v-btn variant="text" density="comfortable" @click="showBlocked = !showBlocked" :prepend-icon="showBlocked ? 'mdi-eye-off-outline' : 'mdi-eye-outline'">
            {{ $t('lessonDetail.regionFiltered', { count: filteredOutCount }) || `部分资源因地区限制未显示（${filteredOutCount}）` }}
          </v-btn>
        </div>
        <v-card-item v-for="(resource, idx) in filteredResources" :key="idx" class="link-preview-container">
          <!-- Single-line clickable title: prefer name; fallback to link -->
          <div class="resource-title">
            <template v-if="resource.link">
              <a class="resource-title-link" :href="resource.link" target="_blank" rel="noopener">{{ resource.name || resource.link }}</a>
            </template>
            <template v-else>
              <span class="resource-title-text">{{ resource.name || '' }}</span>
            </template>
          </div>
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
        <template v-if="showBlocked && hiddenResources.length">
          <v-divider class="my-2" />
          <div class="text-caption text-medium-emphasis mb-1">{{ $t('lessonDetail.filteredTitle') || '被隐藏的资源（可能在中国大陆无法访问）' }}</div>
          <v-card-item v-for="(resource, idx) in hiddenResources" :key="'hidden-' + idx" class="link-preview-container">
            <!-- Single-line clickable title for blocked resources as well -->
            <div class="resource-title">
              <template v-if="resource.link">
                <a class="resource-title-link" :href="resource.link" target="_blank" rel="noopener">{{ resource.name || resource.link }}</a>
              </template>
              <template v-else>
                <span class="resource-title-text">{{ resource.name || '' }}</span>
              </template>
            </div>
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
        </template>
      </div>
      <div v-else-if="resourcesLoaded" class="text-medium-emphasis text-caption">{{ $t('lessonDetail.noResources') }}</div>
    </div>
  </v-card>
</template>

<script>
import { apiClient } from '@/api'
import TagChips from '@/components/common/TagChips.vue'
import { isMainlandChina } from '@/utils/region'
import { filterResourcesForChina, isAccessibleInChina } from '@/utils/resourceFilter'

export default {
  name: 'LessonDetailPanel',
  components: { TagChips },
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
    return { current: this.lesson, loadingLesson: false, resourcesLoaded: false, isCN: false, showBlocked: false }
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
        if (lesson) {
          this.fetchLessonCompletedStatus(lesson)
          this.fetchLessonTags()
        }
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
    async ensureRegion() {
      try { this.isCN = await isMainlandChina() } catch (_) { this.isCN = false }
    },
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
          await this.fetchLessonTags()
        }
      } catch (_) { /* ignore */ }
      finally { this.loadingLesson = false; this.resourcesLoaded = true }
    },
    nodeTitle(n) {
      if (!n) return ''
      const p = n.properties || {}
      return p.name || p.Id || p.id || p.link || ''
    },
    async fetchLessonTags() {
      try {
        const pid = this.planId
        const lid = this.current?.id || this.lessonId
        if (!pid || !lid) return
        const res = await apiClient.get(`/StudyPlanTags/${pid}/Lessons/${encodeURIComponent(lid)}/Tags`)
        const list = Array.isArray(res?.data) ? res.data : []
        const tags = list.map(t => ({ id: t.id || t.Id, name: t.name || t.Name })).filter(x => x.name)
        if (!this.current) this.current = {}
        this.current.tags = tags
      } catch (_) { /* ignore */ }
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
        this.$emit('resource-updated', { completed: next, resource, phase: 'optimistic' })
        const id = resource.id || resource.resourceId
        if (id) {
          if (next) {
            const resp = await apiClient.post(`/resources/${id}/complete`, {
              planId: this.planId,
              lessonId: this.current?.id,
              source: 'checkbox',
              device: 'web',
            })
            // emit updated progress details when available
            const planProgress = resp?.data?.planProgress
            const lessonProgress = resp?.data?.lessonProgress
            const lessonCompleted = resp?.data?.lessonCompletedCount
            const lessonTotal = resp?.data?.lessonTotalResources
            this.$emit('resource-updated', {
              completed: next,
              resource,
              planProgress,
              lessonProgress,
              lessonCompleted,
              lessonTotal,
              phase: 'confirmed',
            })
          } else {
            const resp = await apiClient.delete(`/resources/${id}/complete`, { params: { planId: this.planId, lessonId: this.current?.id } })
            const planProgress = resp?.data?.planProgress
            const lessonProgress = resp?.data?.lessonProgress
            const lessonCompleted = resp?.data?.lessonCompletedCount
            const lessonTotal = resp?.data?.lessonTotalResources
            this.$emit('resource-updated', {
              completed: next,
              resource,
              planProgress,
              lessonProgress,
              lessonCompleted,
              lessonTotal,
              phase: 'confirmed',
            })
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
    filteredResources() {
      const list = Array.isArray(this.current?.resources) ? this.current.resources : []
      if (!this.resourcesLoaded) return list
      return filterResourcesForChina(list, this.isCN)
    },
    filteredOutCount() {
      const list = Array.isArray(this.current?.resources) ? this.current.resources : []
      return Math.max(0, list.length - this.filteredResources.length)
    },
    hiddenResources() {
      const list = Array.isArray(this.current?.resources) ? this.current.resources : []
      if (!this.isCN) return []
      return list.filter(r => !isAccessibleInChina(r?.link || r?.url))
    }
  },
  async mounted() { await this.ensureRegion() },
}
</script>

<style scoped>
.resource-title { font-size: 16px; font-weight: 400; color: #000; line-height: 1.3; }
.resource-title-link { color: inherit; text-decoration: none; }
.resource-title-link:hover { text-decoration: underline; }
.resource-title-text { color: #000; }

@import '../../assets/css/link-preview.css';
.placeholder { color: #999; text-align: center; width: 100%; margin-top: 20px; }
</style>





