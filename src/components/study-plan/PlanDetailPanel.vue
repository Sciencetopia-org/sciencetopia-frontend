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
            <div class="plan-header-actions d-flex align-center flex-wrap justify-end gap-2">
              <template v-if="headerMode === 'groupShared'">
                <v-btn
                  v-if="groupPlanActionState.isEnrolled"
                  size="small"
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-book-open-page-variant-outline"
                  :loading="groupPlanActionState.loading"
                  :disabled="groupPlanActionState.loading"
                  @click="$emit('open-my-plan')"
                >
                  {{ $t('studyplan.viewInMyPlans') }}
                </v-btn>
                <v-btn
                  v-else
                  size="small"
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-account-plus-outline"
                  :loading="groupPlanActionState.loading"
                  :disabled="groupPlanActionState.loading || groupPlanActionState.disabled"
                  @click="$emit('enroll-cohort')"
                >
                  {{ groupPlanActionState.disabled ? $t('cohort.noJoinableClass') : $t('cohort.join') }}
                </v-btn>
              </template>
              <template v-else>
                <v-chip v-if="roleLabel" size="x-small" label color="blue-grey-lighten-4">
                  Plan: {{ roleLabel }}
                </v-chip>
                <v-skeleton-loader v-if="permissionLoading" type="chip" width="120" />
                <v-chip
                  v-else-if="permissionLoaded"
                  size="x-small"
                  label
                  :color="canAdoptComputed ? 'success' : 'grey'"
                  variant="tonal"
                >
                  {{ cohortAdoptionLabel }}
                </v-chip>
                <v-chip v-if="myProgress !== null" size="x-small" label class="mr-2" color="primary">{{
                  $t('studyplan.myProgress', { percent: (typeof myProgress === 'number' ? myProgress.toFixed(2) : myProgress) }) }}</v-chip>
              </template>
              <template v-if="allowEditControls && headerMode !== 'groupShared'">
                <v-btn
                  v-if="canAdoptComputed || canEditComputed"
                  class="mr-1"
                  variant="text"
                  prepend-icon="mdi-account-group-outline"
                  :disabled="permissionLoading || !permissionLoaded"
                  @click="$emit('open-share')"
                >
                  {{ $t('studyplan.shareDialog.title') }}
                </v-btn>
                <v-btn v-if="canEditComputed" icon="mdi-cog-outline" variant="text" @click="$emit('open-settings', plan)"
                  :disabled="permissionLoading || !permissionLoaded"
                  :aria-label="`${$t('setting')} ${plan.title}`" />
              </template>
              <v-btn v-if="headerMode !== 'groupShared'" size="small" color="primary" class="ml-2" :disabled="permissionLoading" @click="$emit('open-progress')">
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
import { fetchEffectivePermissions } from '@/services/effective-permissions'

export default {
  name: 'PlanDetailPanel',
  components: { EditStudyPlanForm, TagChips },
  props: {
    planId: { type: [String, Number], required: true },
    scope: { type: Object, default: () => ({ type: 'me' }) },
    allowEditControls: { type: Boolean, default: true },
    headerMode: { type: String, default: 'default' },
    groupPlanActionState: {
      type: Object,
      default: () => ({ isEnrolled: false, loading: false, disabled: true }),
    },
  },
  emits: ['select-lesson', 'open-share', 'updated-plan', 'open-progress', 'loaded', 'enroll-cohort', 'open-my-plan', 'open-settings'],
  data() {
    return {
      loading: false,
      plan: null,
      myProgress: null,
      selectedLesson: null,
      openSections: [0, 1, 2],
      editDirty: false,
      isEditing: false,
      editDraft: null,
      roleLabel: null,
      permissionLoaded: false,
      permissionLoading: false,
      allowCohortSharing: false,
      canAdoptPlanToCohort: false,
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
    canAdoptComputed() {
      return this.canAdoptPlanToCohort || this.isOwnerComputed || this.canEditComputed
    },
    canEditComputed() {
      return roleAllowsEdit(this.roleLabel)
    },
    cohortAdoptionLabel() {
      if (this.canAdoptComputed) {
        return this.allowCohortSharing
          ? this.$t('studyplan.shareDialog.adoptionOpen')
          : this.$t('studyplan.shareDialog.editorAdoption')
      }
      return this.$t('studyplan.shareDialog.adoptionClosed')
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
    getLessonSections() {
      return ['prerequisite', 'mainCurriculum', 'advancedTopics']
    },
    findLessonEntry(lessonId) {
      if (!this.plan || !lessonId) return null
      const targetId = String(lessonId)
      for (const section of this.getLessonSections()) {
        const list = Array.isArray(this.plan?.[section]) ? this.plan[section] : []
        const index = list.findIndex((lesson) => String(lesson?.id || lesson?.name || '') === targetId)
        if (index >= 0) return { section, index, lesson: list[index] }
      }
      return null
    },
    async loadPlan() {
      this.loading = true
      try {
        const res = await apiClient.get('/StudyPlan/GetStudyPlanById', { params: { studyPlanId: this.planId } })
        const plan = res?.data?.studyPlan || res?.data
        if (plan) {
          const sections = ['prerequisite', 'mainCurriculum', 'advancedTopics']
          sections.forEach((sec) => {
            if (!Array.isArray(plan[sec])) return
            plan[sec] = this.mergeLessons(plan[sec]).map((lesson) => ({
              ...lesson,
              _personalProgressLoaded: typeof lesson?.progressPercentage === 'number',
            }))
          })
          this.plan = plan
          const tags = Array.isArray(plan?.tags) ? plan.tags : []
          this.planTags = tags
            .map(x => ({ id: x.id || x.Id, name: x.name || x.Name }))
            .filter(x => x.name)
          this.myProgress = typeof plan?.progressPercentage === 'number' ? plan.progressPercentage : null
          if (!this.selectedLesson) this.selectFirstUnfinishedLesson()
          return
        } else {
          this.plan = null
          this.planTags = []
          this.myProgress = null
        }
      } catch (e) {
        this.plan = null
        this.planTags = []
        this.myProgress = null
      } finally {
        // Ensure loading is cleared in error/empty-plan cases
        if (this.loading) this.loading = false
        this.$emit('loaded', this.plan)
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
    refreshRole: async function () {
      this.permissionLoading = true
      try {
        const [role, perms] = await Promise.all([
          fetchRole(this.planId, { force: true }),
          fetchEffectivePermissions({ planId: this.planId, force: true }),
        ])
        this.roleLabel = role || getCachedRole(this.planId)
        this.permissionLoaded = !!perms
        this.allowCohortSharing = !!perms?.AllowCohortSharing
        this.canAdoptPlanToCohort = !!(perms?.CanAdoptPlanToCohort || perms?.CanSharePlanToCohort)
      } catch (_) {
        this.permissionLoaded = false
      } finally {
        this.permissionLoading = false
      }
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
    setLessonLoading(lessonId) {
      const match = this.findLessonEntry(lessonId)
      if (!match) return
      match.lesson._personalProgressLoaded = false
    },
    applyLessonProgress(lessonId, progress) {
      const match = this.findLessonEntry(lessonId)
      if (!match) return
      const normalized = typeof progress === 'number'
        ? (progress <= 1 ? progress * 100 : progress)
        : null
      if (normalized === null) {
        match.lesson._personalProgressLoaded = true
        return
      }
      match.lesson.progressPercentage = Math.round(normalized * 100) / 100
      match.lesson._personalProgressLoaded = true
      if (this.selectedLesson && String(this.selectedLesson?.id || this.selectedLesson?.name || '') === String(lessonId)) {
        this.selectedLesson.progressPercentage = match.lesson.progressPercentage
        this.selectedLesson._personalProgressLoaded = true
      }
    },
    async fetchLessonsProgress() {
      await this.loadPlan()
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

.gap-2 {
  gap: 8px;
}

.plan-header-actions {
  min-height: 32px;
}

/* no skeleton styles; progress bars appear only when data is ready */
</style>

