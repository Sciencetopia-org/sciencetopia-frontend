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
              <h2 class="plan-title">编辑：{{ plan.title }}</h2>
            </div>
            <div>
              <v-btn class="mr-2" variant="text" @click="cancelEdit">取消</v-btn>
              <v-btn size="small" variant="text" color="blue" @click="saveFromHeader">保存学习计划</v-btn>
            </div>
          </div>
          <EditStudyPlanForm ref="editForm" :studyPlan="editDraft" :showTopSave="false" @save="saveStudyPlan"
            @dirty="editDirty = true" />
        </div>
        <div v-else>
          <div class="plan-header d-flex align-start justify-space-between">
            <div>
              <h2 class="plan-title">{{ plan.title }}</h2>
            </div>
            <div class="d-flex align-center">
              <v-chip v-if="roleLabel" size="x-small" label class="mr-2">{{ roleLabel }}</v-chip>
              <v-chip v-if="myProgress !== null" size="x-small" label class="mr-2" color="primary">{{
                $t('studyplan.myProgress', { percent: myProgress }) }}</v-chip>
              <template v-if="allowEditControls">
                <v-btn v-if="isOwnerComputed" class="mr-1" variant="text" @click="$emit('open-share')">{{
                  $t('studyplan.share') }}</v-btn>
                <v-btn v-if="canEditComputed" icon="mdi-pencil" variant="text" @click="startEdit()"
                  :aria-label="`编辑 ${plan.title}`" />
              </template>
              <v-btn size="small" variant="outlined" color="primary" class="ml-2" @click="$emit('open-progress')">
                学习小组·速度与排行榜
              </v-btn>
            </div>
          </div>
          <p class="plan-desc">{{ (plan.introduction && plan.introduction.description) || '' }}</p>

          <!-- 进度与排行榜已迁移为独立 ProgressPage -->
          <v-expansion-panels multiple v-model="openSections" class="mt-2">
            <v-expansion-panel title="预备知识" v-if="plan.prerequisite && plan.prerequisite.length">
              <v-expansion-panel-text>
                <v-list density="comfortable">
                  <v-list-item v-for="(lesson, idx) in plan.prerequisite" :key="'pre-' + idx" @click="select(lesson)"
                    :class="{ 'selected-lesson': selectedLesson && selectedLesson.name === lesson.name }">
                    <v-list-item-title>{{ lesson.name }}</v-list-item-title>
                    <v-progress-linear :model-value="lesson.progressPercentage" height="6" color="primary" />
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel title="主要课程" v-if="plan.mainCurriculum && plan.mainCurriculum.length">
              <v-expansion-panel-text>
                <v-list density="comfortable">
                  <v-list-item v-for="(lesson, idx) in plan.mainCurriculum" :key="'main-' + idx" @click="select(lesson)"
                    :class="{ 'selected-lesson': selectedLesson && selectedLesson.name === lesson.name }">
                    <v-list-item-title>{{ lesson.name }}</v-list-item-title>
                    <v-progress-linear :model-value="lesson.progressPercentage" height="6" color="primary" />
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel title="进阶内容" v-if="plan.advancedTopics && plan.advancedTopics.length">
              <v-expansion-panel-text>
                <v-list density="comfortable">
                  <v-list-item v-for="(lesson, idx) in plan.advancedTopics" :key="'adv-' + idx" @click="select(lesson)"
                    :class="{ 'selected-lesson': selectedLesson && selectedLesson.name === lesson.name }">
                    <v-list-item-title>{{ lesson.name }}</v-list-item-title>
                    <v-progress-linear :model-value="lesson.progressPercentage" height="6" color="accent" />
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
import EditStudyPlanForm from '@/components/EditStudyPlanForm.vue'
import { fetchEffectiveRole as fetchRole, getRole as getCachedRole, roleAllowsEdit } from '@/services/studyplan-permissions'

export default {
  name: 'PlanDetailPanel',
  components: { EditStudyPlanForm },
  props: {
    planId: { type: [String, Number], required: true },
    scope: { type: Object, default: () => ({ type: 'me' }) },
    allowEditControls: { type: Boolean, default: true },
  },
  emits: ['select-lesson', 'open-share', 'updated-plan', 'open-progress'],
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
    }
  },
  computed: {
    emptyText() {
      return '暂无数据'
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
    async loadPlan() {
      this.loading = true
      try {
        const res = await apiClient.get('/StudyPlan/GetStudyPlanById', { params: { studyPlanId: this.planId } })
        const plan = res?.data?.studyPlan || res?.data
        if (plan) {
          const sections = ['prerequisite', 'mainCurriculum', 'advancedTopics']
          sections.forEach((sec) => { if (plan[sec]) plan[sec] = this.mergeLessons(plan[sec]) })
          this.plan = plan
          await this.fetchMyProgress()
        } else {
          this.plan = null
        }
      } catch (e) {
        this.plan = null
      } finally {
        this.loading = false
      }
    },
    async fetchMyProgress() {
      try {
        const res = await apiClient.get(`/studyPlans/${this.planId}/progress/me`)
        const p = res?.data?.planProgress
        this.myProgress = typeof p === 'number' ? p : null
      } catch (_) {
        this.myProgress = null
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
      this.$emit('select-lesson', id)
    },
    startEdit() {
      if (!this.allowEditControls || !this.canEditComputed) return
      this.editDraft = JSON.parse(JSON.stringify(this.plan))
      this.editDirty = false
      this.isEditing = true
    },
    cancelEdit() {
      if (this.editDirty) {
        const ok = window.confirm('你在编辑中已有输入，确定要取消吗？未保存的内容将丢失。')
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
        if (plan.id) await apiClient.post('/StudyPlan/UpdateStudyPlan', { studyPlan: plan })
        else await apiClient.post('/StudyPlan/SaveStudyPlan', { studyPlan: plan })
        this.editDirty = false
        this.isEditing = false
        await this.loadPlan()
        this.$emit('updated-plan', this.plan)
      } catch (e) { }
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
</style>
