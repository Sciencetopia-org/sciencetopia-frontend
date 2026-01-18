<template>
  <div class="plan-detail-panel">
    <div v-if="loading">
      <v-skeleton-loader type="list-item" v-for="n in 5" :key="n" />
    </div>
    <template v-else>
      <div v-if="plan">
        <div v-if="isEditing">
          <div class="plan-header d-flex align-center justify-space-between">
            <div>
              <h2 class="plan-title">{{ $t('edit') }}{{ $t(':') }}{{ plan.title }}</h2>
            </div>
            <div>
              <v-btn class="mr-2" variant="text" @click="cancelEdit">{{ $t('cancel') }}</v-btn>
              <v-btn size="small" variant="text" color="blue" @click="saveFromHeader" :disabled="saving" :loading="saving">{{ $t('save') }}{{ $t('wordbreaker') }}{{ $t('header.studyplan') }}</v-btn>
            </div>
          </div>
          <EditStudyPlanForm ref="editForm" :studyPlan="editDraft" :showTopSave="false" :saving="saving" @save="saveStudyPlan"
            @dirty="editDirty = true" />
        </div>
        <div v-else>
          <div class="plan-header d-flex align-start justify-space-between">
            <div class="d-flex align-center">
              <h2 class="plan-title mr-2">{{ plan.title }}</h2>
              <TagChips v-if="planTags.length" :items="planTags" />
            </div>
            <div class="d-flex align-center">
              <v-chip v-if="roleLabel" size="x-small" label class="mr-2">{{ roleLabel }}</v-chip>
              <v-skeleton-loader v-if="myProgressLoading" type="chip" class="mr-2" style="width:90px; height:26px" />
              <v-chip v-else-if="myProgress !== null" size="x-small" label class="mr-2" color="primary">{{
                $t('studyplan.myProgress', { percent: (typeof myProgress === 'number' ? myProgress.toFixed(2) : myProgress) }) }}</v-chip>
              <template v-if="allowEditControls">
                <v-btn v-if="isOwnerComputed" class="mr-1" variant="text" @click="$emit('open-share')">{{ $t('studyplan.share') }}</v-btn>
                <v-btn v-if="canEditComputed" icon="mdi-pencil" variant="text" @click="startEdit()"
                  :aria-label="`${$t('edit')} ${plan.title}`" />
              </template>
              <v-btn size="small" color="primary" class="ml-2" @click="$emit('open-progress')">
                {{ $t('cohort.viewStats') }}
              </v-btn>
            </div>
          </div>
          <p class="plan-desc">{{ (plan.introduction && plan.introduction.description) || '' }}</p>

          <!-- 进度与排行榜已迁移为独立 ProgressPage -->
          <v-expansion-panels multiple v-model="openSections" class="mt-2">
            <v-expansion-panel :title="$t('studyplan.prerequisites')" v-if="plan.prerequisite && plan.prerequisite.length">
              <v-expansion-panel-text>
                <v-list density="comfortable">
                  <v-list-item v-for="(lesson, idx) in plan.prerequisite" :key="'pre-' + idx" @click="select(lesson)"
                    :class="{ 'selected-lesson': selectedLesson && selectedLesson.name === lesson.name }">
                    <v-list-item-title>{{ lesson.name }}</v-list-item-title>
                    <v-skeleton-loader v-if="lesson._personalProgressLoaded === false" type="text" class="mt-1" style="height:6px" />
                    <v-progress-linear v-else-if="typeof lesson.progressPercentage === 'number'" :model-value="lesson.progressPercentage" height="6" color="primary" />
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel :title="$t('studyplan.maincurriculum')" v-if="plan.mainCurriculum && plan.mainCurriculum.length">
              <v-expansion-panel-text>
                <v-list density="comfortable">
                  <v-list-item v-for="(lesson, idx) in plan.mainCurriculum" :key="'main-' + idx" @click="select(lesson)"
                    :class="{ 'selected-lesson': selectedLesson && selectedLesson.name === lesson.name }">
                    <v-list-item-title>{{ lesson.name }}</v-list-item-title>
                    <v-skeleton-loader v-if="lesson._personalProgressLoaded === false" type="text" class="mt-1" style="height:6px" />
                    <v-progress-linear v-else-if="typeof lesson.progressPercentage === 'number'" :model-value="lesson.progressPercentage" height="6" color="primary" />
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel :title="$t('studyplan.advancedtopics')" v-if="plan.advancedTopics && plan.advancedTopics.length">
              <v-expansion-panel-text>
                <v-list density="comfortable">
                  <v-list-item v-for="(lesson, idx) in plan.advancedTopics" :key="'adv-' + idx" @click="select(lesson)"
                    :class="{ 'selected-lesson': selectedLesson && selectedLesson.name === lesson.name }">
                    <v-list-item-title>{{ lesson.name }}</v-list-item-title>
                    <v-skeleton-loader v-if="lesson._personalProgressLoaded === false" type="text" class="mt-1" style="height:6px" />
                    <v-progress-linear v-else-if="typeof lesson.progressPercentage === 'number'" :model-value="lesson.progressPercentage" height="6" color="accent" />
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </div>
      <div v-else class="placeholder">{{ emptyText }}</div>
    </template>
  </div>
</template>

<script>
import { apiClient } from '@/api'
import EditStudyPlanForm from '@/components/study-plan/EditStudyPlanForm.vue'
import TagChips from '@/components/common/TagChips.vue'
import { fetchEffectiveRole as fetchRole, getRole as getCachedRole, roleAllowsEdit } from '@/services/studyplan-permissions'

export default {
  name: 'PlanDetailPanel',
  components: { EditStudyPlanForm, TagChips },
  props: {
    planId: { type: [String, Number], required: true },
    scope: { type: Object, default: () => ({ type: 'me' }) },
    allowEditControls: { type: Boolean, default: true },
  },
  emits: ['select-lesson', 'open-share', 'updated-plan', 'open-progress', 'loaded'],
  data() {
    return {
      loading: false,
      plan: null,
      myProgress: null,
      myProgressLoading: false,
      selectedLesson: null,
      openSections: [0, 1, 2],
      editDirty: false,
      isEditing: false,
      editDraft: null,
      roleLabel: null,
      planTags: [],
      saving: false,
    }
  },
  computed: {
    emptyText() {
      return this.$t('common.noData')
    },
    isOwnerComputed() {
      return this.roleLabel === 'Owner'
    },
    canEditComputed() {
      return roleAllowsEdit(this.roleLabel)
    },
  },
  watch: {
    planId: {
      immediate: true,
      async handler(val) {
        if (!val) { this.plan = null; return }
        await this.loadPlan()
        this.refreshRole()
      },
    },
  },
  methods: {
    setLessonLoading(lessonId) {
      if (!this.plan || !lessonId) return
      const secs = ['prerequisite', 'mainCurriculum', 'advancedTopics']
      for (const sec of secs) {
        const list = Array.isArray(this.plan[sec]) ? this.plan[sec] : []
        list.forEach(l => {
          const lid = l?.id || l?.lessonId || l?.name
          if (String(lid) === String(lessonId)) {
            l._personalProgressLoaded = false
          }
        })
      }
    },
    async loadPlan() {
      this.loading = true
      try {
        const res = await apiClient.get('/StudyPlan/GetStudyPlanById', { params: { studyPlanId: this.planId } })
        const plan = res?.data?.studyPlan || res?.data
        if (plan) {
          const sections = ['prerequisite', 'mainCurriculum', 'advancedTopics']
          sections.forEach((sec) => { if (plan[sec]) plan[sec] = this.mergeLessons(plan[sec]) })
          // Hide lesson progress bars until personal progress API returns
          sections.forEach((sec) => {
            const list = plan[sec]
            if (Array.isArray(list)) list.forEach(l => { l._personalProgressLoaded = false })
          })
          this.plan = plan
          // Fetch plan tags (read-only chips)
          try {
            const t = await apiClient.get(`/StudyPlanTags/${this.planId}/Tags`)
            const list = Array.isArray(t?.data) ? t.data : []
            this.planTags = list.map(x => ({ id: x.id || x.Id, name: x.name || x.Name })).filter(x => x.name)
          } catch (_) { this.planTags = [] }
          // Immediately render plan details without waiting for progress APIs
          this.loading = false
          // Fire-and-forget progress fetches; update UI when they resolve
          this.fetchMyProgress().catch(() => { this.myProgress = null })
          this.fetchLessonsProgress()
            .then(() => { if (!this.selectedLesson) this.selectFirstUnfinishedLesson() })
            .catch(() => { /* ignore individual lesson progress errors */ })
          // Also try to select something promptly before per-lesson progress returns
          if (!this.selectedLesson) this.selectFirstUnfinishedLesson()
          return
        } else {
          this.plan = null
        }
      } catch (e) {
        this.plan = null
      } finally {
        // Ensure loading is cleared in error/empty-plan cases
        if (this.loading) this.loading = false
        this.$emit('loaded')
      }
    },
    selectFirstUnfinishedLesson() {
      if (!this.plan) return
      const secs = ['prerequisite', 'mainCurriculum', 'advancedTopics']
      for (const sec of secs) {
        const list = Array.isArray(this.plan[sec]) ? this.plan[sec] : []
        const target = list.find(l => typeof l?.progressPercentage !== 'number' || l.progressPercentage < 100)
        if (target) { this.select(target); return }
      }
      // fallback: pick the very first lesson if all completed
      for (const sec of secs) {
        const list = Array.isArray(this.plan[sec]) ? this.plan[sec] : []
        if (list.length) { this.select(list[0]); return }
      }
    },
    async fetchLessonsProgress() {
      try {
        if (!this.plan) return
        const sections = ['prerequisite', 'mainCurriculum', 'advancedTopics']
        const promises = []
        sections.forEach((sec) => {
          const list = this.plan[sec]
          if (!Array.isArray(list)) return
          list.forEach((lesson) => {
            const lid = lesson?.id || lesson?.lessonId || lesson?.name
            if (!lid) return
            const p = apiClient
              .get(`/StudyPlans/${this.planId}/Lessons/${encodeURIComponent(lid)}/Progress/Me`)
              .then((res) => {
                const val = res?.data?.lessonProgress ?? res?.data?.progress ?? res?.data?.percentage ?? res?.data?.progressPercentage ?? res?.data
                if (typeof val === 'number') {
                  lesson.progressPercentage = val * 100
                  lesson._personalProgressLoaded = true
                }
              })
              .catch(() => { /* ignore individual errors */ })
            promises.push(p)
          })
        })
        await Promise.allSettled(promises)
      } catch (_) { /* no-op */ }
    },
    async fetchMyProgress() {
      try {
        this.myProgressLoading = true
        const res = await apiClient.get(`StudyPlans/${this.planId}/Progress/Me`)
        const p = res?.data?.planProgress
        this.myProgress = typeof p === 'number' ? p : null
      } catch (_) {
        this.myProgress = null
      } finally {
        this.myProgressLoading = false
      }
    },
    refreshRole: async function () {
      try {
        const role = await fetchRole(this.planId, { force: true })
        this.roleLabel = role || getCachedRole(this.planId)
      } catch (_) { }
    },
    mergeLessons(lessons) {
      const map = new Map()
      lessons.forEach((lesson) => {
        const existing = map.get(lesson.name)
        if (existing) {
          const resources = lesson.resources || []
          existing.resources = existing.resources.concat(resources)
        } else {
          map.set(lesson.name, { ...lesson, resources: lesson.resources ? [...lesson.resources] : [] })
        }
      })
      return Array.from(map.values())
    },
    select(lesson) {
      this.selectedLesson = lesson
      const id = lesson?.id || lesson?.name
      // Emit both id and lesson to allow parent to avoid refetching in the right panel
      this.$emit('select-lesson', id, lesson)
    },
    startEdit() {
      if (!this.allowEditControls || !this.canEditComputed) return
      this.editDraft = JSON.parse(JSON.stringify(this.plan))
      this.editDirty = false
      this.isEditing = true
    },
    cancelEdit() {
      if (this.editDirty) {
        const ok = window.confirm(this.$t('studyplan.dialogs.confirmCloseWithUnsaved'))
        if (!ok) return
      }
      this.isEditing = false
      this.editDirty = false
    },
    saveFromHeader() {
      if (this.$refs.editForm && this.$refs.editForm.saveStudyPlan) {
        this.$refs.editForm.saveStudyPlan()
      }
    },
    async saveStudyPlan(plan) {
      try {
        this.saving = true
        // Extract tag payload and strip from plan for save
        const tagPayload = plan && plan.__tags ? plan.__tags : null
        const studyPlan = { ...plan }
        if (studyPlan.__tags) delete studyPlan.__tags

        let planId = studyPlan?.id
        if (planId) {
          await apiClient.post('/StudyPlan/UpdateStudyPlan', { studyPlan })
        } else {
          const resp = await apiClient.post('/StudyPlan/SaveStudyPlan', { studyPlan })
          planId = resp?.data?.studyPlanId || planId
        }

        // Attach tags if provided
        if (planId && tagPayload) {
          try {
            const planNames = Array.isArray(tagPayload.planTagNames) ? tagPayload.planTagNames : []
            if (planNames.length) await apiClient.post(`/StudyPlanTags/${planId}/Tags`, { newTagNames: planNames })

            // Map lesson keys to actual lesson ids
            const detail = await apiClient.get('/StudyPlan/GetStudyPlanById', { params: { studyPlanId: planId } })
            const sp = detail?.data?.studyPlan || detail?.data
            if (sp) {
              const keyToId = {}
              const secs = ['prerequisite', 'mainCurriculum', 'advancedTopics']
              secs.forEach(sec => {
                const list = Array.isArray(sp[sec]) ? sp[sec] : []
                list.forEach((l, idx) => {
                  const key1 = l?.id || `${sec}:${idx}:${l?.name}`
                  if (key1) keyToId[key1] = l?.id
                })
              })
              const lessons = tagPayload.lessonTagNames || {}
              for (const key in lessons) {
                const names = lessons[key]
                const lid = keyToId[key]
                if (!lid || !Array.isArray(names) || !names.length) continue
                await apiClient.post(`/StudyPlanTags/${planId}/Lessons/${encodeURIComponent(lid)}/Tags`, { newTagNames: names })
              }
            }
          } catch (_) { /* ignore tag errors */ }
        }

        this.editDirty = false
        this.isEditing = false
        await this.loadPlan()
        this.$emit('updated-plan', this.plan)
      } catch (e) { /* no-op */ }
      finally { this.saving = false }
    },
  },
}
</script>

<style scoped>
.plan-header {
  padding: 8px 0 12px;
}

.plan-title {
  margin: 0 0 6px 0;
}

.plan-desc {
  margin: 0 0 8px 0;
  color: rgba(0, 0, 0, 0.7);
}

.selected-lesson {
  font-weight: bold;
  background-color: #f0f0f0;
}

.placeholder {
  color: #999;
  text-align: center;
  width: 100%;
  margin-top: 20px;
}

/* no skeleton styles; progress bars appear only when data is ready */
</style>

