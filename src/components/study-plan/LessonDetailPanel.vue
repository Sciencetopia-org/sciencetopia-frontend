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
          <v-btn variant="text" density="comfortable" :disabled="loadingLesson" @click="showBlocked = !showBlocked" :prepend-icon="showBlocked ? 'mdi-eye-off-outline' : 'mdi-eye-outline'">
            {{ $t('lessonDetail.regionFiltered', { count: filteredOutCount }) || `部分资源因地区限制未显示（${filteredOutCount}）` }}
          </v-btn>
        </div>
        <v-card-item v-for="(resource, idx) in filteredResources" :key="idx" class="link-preview-container">
          <!-- Single-line clickable title: prefer name; fallback to link -->
          <div class="resource-title">
            <template v-if="resource.link">
              <a class="resource-title-link" :href="safeResourceUrl(resource.link)" target="_blank" rel="noopener noreferrer">{{ resource.name || resource.link }}</a>
            </template>
            <template v-else>
              <span class="resource-title-text">{{ resource.name || '' }}</span>
            </template>
          </div>
          <div class="d-flex align-center mt-1">
            <div class="resource-checkbox-wrap">
              <v-checkbox
                :model-value="resource.learned === true"
                :disabled="!isInteractable || isResourceBusy(resource)"
                hide-details
                density="compact"
                class="resource-status-checkbox"
                :class="{ 'resource-status-checkbox--busy': isResourceBusy(resource) }"
                @click.stop
                @update:model-value="(value) => toggleResource(resource, value)"
                :label="resource.learned ? $t('lessonDetail.completed') : $t('lessonDetail.notCompleted')"
              />
              <span v-if="isResourceBusy(resource)" class="resource-status-checkbox__spinner">
                <v-progress-circular
                  indeterminate
                  :size="12"
                  :width="2"
                  color="primary"
                />
              </span>
            </div>
          </div>
        </v-card-item>
        <template v-if="showBlocked && hiddenResources.length">
          <v-divider class="my-2" />
          <div class="text-caption text-medium-emphasis mb-1">{{ $t('lessonDetail.filteredTitle') || '被隐藏的资源（可能在中国大陆无法访问）' }}</div>
          <v-card-item v-for="(resource, idx) in hiddenResources" :key="'hidden-' + idx" class="link-preview-container">
            <!-- Single-line clickable title for blocked resources as well -->
            <div class="resource-title">
              <template v-if="resource.link">
                <a class="resource-title-link" :href="safeResourceUrl(resource.link)" target="_blank" rel="noopener noreferrer">{{ resource.name || resource.link }}</a>
              </template>
              <template v-else>
                <span class="resource-title-text">{{ resource.name || '' }}</span>
              </template>
            </div>
            <div class="d-flex align-center mt-1">
              <div class="resource-checkbox-wrap">
                <v-checkbox
                  :model-value="resource.learned === true"
                  :disabled="!isInteractable || isResourceBusy(resource)"
                  hide-details
                  density="compact"
                  class="resource-status-checkbox"
                  :class="{ 'resource-status-checkbox--busy': isResourceBusy(resource) }"
                  @click.stop
                  @update:model-value="(value) => toggleResource(resource, value)"
                  :label="resource.learned ? $t('lessonDetail.completed') : $t('lessonDetail.notCompleted')"
                />
                <span v-if="isResourceBusy(resource)" class="resource-status-checkbox__spinner">
                  <v-progress-circular
                    indeterminate
                    :size="12"
                    :width="2"
                    color="primary"
                  />
                </span>
              </div>
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
import { getResourceId } from '@/utils/resourceProgress'
import { safeUrl } from '@/utils/text'

const lessonDetailCache = new Map()
const lessonDetailInflight = new Map()

function cloneLessonPayload(lesson) {
  try {
    return JSON.parse(JSON.stringify(lesson || null))
  } catch (_) {
    return lesson ? { ...lesson } : null
  }
}

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
    return {
      current: this.lesson,
      loadingLesson: false,
      resourcesLoaded: false,
      isCN: false,
      showBlocked: false,
      busyResourceKeys: {},
    }
  },
  watch: {
    lesson: {
      immediate: true,
      async handler(lesson) {
        await this.syncLessonState(lesson, this.lessonId)
      },
    },
    lessonId: {
      async handler(id) {
        await this.syncLessonState(this.lesson, id)
      },
    },
  },
  methods: {
    getCacheKey(planId = this.planId, lessonId = this.lessonId) {
      return `${String(planId || '')}:${String(lessonId || '')}`
    },
    hasCompleteLesson(lesson) {
      return !!lesson
        && Array.isArray(lesson.resources)
        && Array.isArray(lesson.tags)
    },
    async syncLessonState(lesson, lessonId) {
      if (!lessonId || !this.planId) {
        this.current = lesson || null
        this.resourcesLoaded = !!lesson
        this.busyResourceKeys = {}
        return
      }

      if (this.hasCompleteLesson(lesson)) {
        const normalized = cloneLessonPayload(lesson)
        this.current = normalized
        this.resourcesLoaded = true
        this.busyResourceKeys = {}
        lessonDetailCache.set(this.getCacheKey(this.planId, lessonId), normalized)
        return
      }

      if (lesson) {
        this.current = cloneLessonPayload(lesson)
      }

      await this.fetchLessonById()
    },
    async ensureRegion() {
      try { this.isCN = await isMainlandChina() } catch (_) { this.isCN = false }
    },
    async fetchLessonById() {
      const cacheKey = this.getCacheKey()
      if (lessonDetailCache.has(cacheKey)) {
        this.current = cloneLessonPayload(lessonDetailCache.get(cacheKey))
        this.loadingLesson = false
        this.resourcesLoaded = true
        return
      }

      if (lessonDetailInflight.has(cacheKey)) {
        this.loadingLesson = true
        try {
          const lesson = await lessonDetailInflight.get(cacheKey)
          this.current = cloneLessonPayload(lesson)
        } catch (_) {
          // ignore
        } finally {
          this.loadingLesson = false
          this.resourcesLoaded = true
        }
        return
      }

      const requestedPlanId = this.planId
      const requestedLessonId = this.lessonId
      try {
        // loadingLesson is set by callers to avoid flicker
        if (!this.loadingLesson) this.loadingLesson = true
        this.resourcesLoaded = false
        const lid = encodeURIComponent(requestedLessonId)
        const request = apiClient
          .get(`/StudyPlans/${requestedPlanId}/Lessons/${lid}`)
          .then((res) => res?.data?.lesson || res?.data || null)
        lessonDetailInflight.set(cacheKey, request)
        const lesson = await request
        if (lesson) {
          const normalized = cloneLessonPayload(lesson)
          lessonDetailCache.set(cacheKey, normalized)
        if (String(this.planId || '') === String(requestedPlanId || '')
            && String(this.lessonId || '') === String(requestedLessonId || '')) {
            this.current = cloneLessonPayload(normalized)
            this.busyResourceKeys = {}
          }
        }
      } catch (_) { /* ignore */ }
      finally {
        lessonDetailInflight.delete(cacheKey)
        this.loadingLesson = false
        this.resourcesLoaded = true
      }
    },
    nodeTitle(n) {
      if (!n) return ''
      const p = n.properties || {}
      return p.name || p.Id || p.id || p.link || ''
    },
    safeResourceUrl(url) {
      return safeUrl(url)
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
    resourceKey(resource) {
      return String(resource?.id || resource?.resourceId || resource?.link || resource?.url || resource?.name || '')
    },
    isResourceBusy(resource) {
      return !!this.busyResourceKeys[this.resourceKey(resource)]
    },
    setResourceBusy(resource, busy) {
      const key = this.resourceKey(resource)
      if (!key) return
      this.busyResourceKeys = {
        ...this.busyResourceKeys,
        [key]: busy,
      }
    },
    async toggleResource(resource, nextValue) {
      try {
        if (!this.isInteractable || this.isResourceBusy(resource)) return
        const previous = resource.learned === true
        const next = nextValue === true
        if (next === previous) return
        this.setResourceBusy(resource, true)
        // optimistic update
        resource.learned = next
        this.$emit('resource-updated', { completed: next, resource, phase: 'optimistic' })
        const id = getResourceId(resource)
        if (id) {
          if (next) {
            const resp = await apiClient.post(`/resources/${id}/complete`, {
              planId: this.planId,
              lessonId: this.current?.id,
              resourceLink: resource.link || resource.url,
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
            const resp = await apiClient.delete(`/resources/${id}/complete`, { params: { planId: this.planId, lessonId: this.current?.id, resourceLink: resource.link || resource.url } })
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
            link: resource.link || resource.url,
          })
        }
        lessonDetailCache.set(this.getCacheKey(), cloneLessonPayload(this.current))
      } catch (e) {
        // rollback
        resource.learned = !resource.learned
        this.$emit('resource-updated', { completed: resource.learned, resource, error: e })
      } finally {
        this.setResourceBusy(resource, false)
      }
    },
  },
  computed: {
    isInteractable() { return !!this.canInteract && !this.disabled && !this.loadingLesson && this.resourcesLoaded },
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
@import '../../assets/css/resource-status.css';
.resource-title { font-size: 16px; font-weight: 400; color: #000; line-height: 1.3; }
.resource-title-link { color: inherit; text-decoration: none; }
.resource-title-link:hover { text-decoration: underline; }
.resource-title-text { color: #000; }

@import '../../assets/css/link-preview.css';
.placeholder { color: #999; text-align: center; width: 100%; margin-top: 20px; }
</style>





