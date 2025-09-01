<template>
  <v-container fluid class="study-plan-workspace">
    <v-row>
      <!-- Left: study plan list -->
      <v-col :cols="collapsed ? 1 : 3" class="pa-0">
        <v-card rounded="xl" elevation="2" class="left-panel">
          <div class="plan-list-header d-flex align-center px-4 py-2">
            <span class="text-h6">{{ $t('studyplan.myplans') }}</span>
            <v-spacer />
            <v-btn :aria-label="$t('studyplan.create')" icon="mdi-plus" variant="text" @click="openCreateDialog"
              :disabled="backgroundGenerating" />
            <v-btn :aria-label="$t('studyplan.aiGenerate')" icon="mdi-robot-outline" variant="text"
              @click="openAiDialog" :disabled="backgroundGenerating" />
          </div>
          <v-divider />
          <v-tabs v-model="listScope" density="compact" class="px-2">
            <v-tab value="mine">{{ $t('studyplan.tabs.mine') }}</v-tab>
            <v-tab value="shared">{{ $t('studyplan.tabs.shared') }}</v-tab>
            <v-tab value="public">{{ $t('studyplan.tabs.public') }}</v-tab>
          </v-tabs>
          <div class="d-flex align-center px-3 pb-2 gap-2">
            <v-text-field
              v-model="q"
              :label="$t('common.search')"
              density="compact"
              hide-details
              clearable
              append-inner-icon="mdi-magnify"
              @click:append-inner="fetchPlans"
              @keyup.enter="fetchPlans"
              @click:clear="fetchPlans"
            />
            <v-select v-model="sort" :items="sortItems" :label="$t('common.sort')" density="compact" hide-details
              style="max-width: 200px" @update:model-value="fetchPlans" />
          </div>
          <v-divider />
          <template v-if="listLoading">
            <v-skeleton-loader type="list-item" v-for="n in 3" :key="n" />
          </template>
          <template v-else-if="studyPlans.length">
            <v-list density="compact" class="plan-list">
              <v-list-item
                v-for="plan in studyPlans"
                :key="plan.studyPlan.id"
                @click="selectPlan(plan.studyPlan)"
                class="plan-card"
                :class="{
                  'selected-plan': currentPlan && currentPlan.id === plan.studyPlan.id,
                }"
              >
                <div class="plan-header-row d-flex align-center justify-space-between">
                  <div class="title">{{ plan.studyPlan.title }}</div>
                  <div class="actions d-flex align-center">
                    <v-chip v-if="getRole(plan.studyPlan.id)" size="x-small" label class="mr-2">
                      {{ getRole(plan.studyPlan.id) }}
                    </v-chip>
                    <v-btn
                      v-if="canEdit(plan.studyPlan.id)"
                      icon="mdi-pencil"
                      variant="text"
                      density="comfortable"
                      @click.stop="editPlanById(plan.studyPlan.id)"
                      :aria-label="`编辑 ${plan.studyPlan.title}`"
                    />
                  </div>
                </div>
                <v-progress-linear
                  v-if="plan.studyPlan.progress !== undefined"
                  :model-value="plan.studyPlan.progress"
                  height="6"
                  color="primary"
                  rounded
                  class="mt-2"
                >
                  <template #default>
                    <span class="text-caption">{{ Math.round(plan.studyPlan.progress) }}%</span>
                  </template>
                </v-progress-linear>
              </v-list-item>
            </v-list>
          </template>
          <div v-else class="empty-plan-list text-center px-4">
            <p class="mb-4">你还没有创建学习计划</p>
            <v-btn block class="mb-2" color="primary" @click="openCreateDialog" :disabled="backgroundGenerating">
              新建学习计划
            </v-btn>
            <v-btn block color="secondary" @click="openAiDialog" :disabled="backgroundGenerating">
              AI 生成计划
            </v-btn>
          </div>
          <div class="d-flex justify-end pa-2">
            <v-btn icon="mdi-menu-open" @click="collapsed = !collapsed" />
          </div>
        </v-card>
      </v-col>

      <!-- Middle + Right (default): Plan and Lesson panels -->
      <template v-if="!showProgressPage">
        <v-col :cols="collapsed ? 6 : 5" class="center-panel">
          <PlanContextBar v-if="currentPlan?.id" :scope="scope" :groups="affiliations" @change="onScopeChange"
            @open-group="(gid) => $router.push({ name: 'GroupPlanWorkspace', params: { groupId: gid, planId: currentPlan.id } })" />
          <PlanDetailPanel v-if="currentPlan?.id" :planId="currentPlan.id" :scope="scope" :allowEditControls="true"
            @select-lesson="selectLessonById" @open-share="openShareDialog" @open-progress="showProgressPage = true"
            @updated-plan="(p) => (currentPlan = p)" />
          <!-- 未选择计划时不显示占位条 -->
          <template v-else></template>
        </v-col>

        <!-- Right: Lesson detail panel -->
        <v-col :cols="collapsed ? 5 : 4" class="right-panel">
          <LessonDetailPanel
            v-if="currentLesson || currentLessonId"
            :planId="currentPlan?.id"
            :lesson="currentLesson"
            :lessonId="currentLessonId"
            :scope="scope"
            :canInteract="canCommentOrProgress(currentPlan?.id)"
            :disabled="!canCommentOrProgress(currentPlan?.id)"
            @resource-updated="onResourceUpdated"
          />
        </v-col>
      </template>

      <!-- ProgressPage occupying middle + right columns -->
      <template v-else>
        <v-col :cols="collapsed ? 11 : 9" class="center-panel">
          <ProgressPage :planId="currentPlan?.id" @close="showProgressPage = false" />
        </v-col>
      </template>
    </v-row>

    <!-- AI planner dialog -->
    <v-dialog v-model="aiDialog" max-width="800" theme="light" persistent @update:model-value="onAiDialogChange">
      <v-card color="white" rounded="xl">
        <v-card-title class="text-h6">AI 学习计划生成器</v-card-title>
        <v-card-text>
          <!-- 子组件在任一输入变化时 $emit('dirty') -->
          <LearningPlanner @dirty="aiDirty = true" @background="handleBackground" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="attemptClose('ai')">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit / create dialog -->
    <v-dialog v-model="editDialog" max-width="800" theme="light" persistent>
      <v-card color="white" rounded="xl">
        <v-card-title class="text-h6">
          {{ editPlan && editPlan.id ? '编辑学习计划' : '新建学习计划' }}
        </v-card-title>
        <v-card-text>
          <!-- 子组件在任一输入变化时 $emit('dirty') -->
          <EditStudyPlanForm :studyPlan="editPlan" @save="saveStudyPlan" @dirty="editDirty = true" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="attemptClose('edit')">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Share dialog -->
    <ShareStudyPlanDialog v-model="shareDialog" v-if="currentPlan?.id" :planId="currentPlan.id" />

    <v-snackbar v-model="backgroundSnackbar" :timeout="backgroundLoading ? -1 : 3000">
      <div class="d-flex align-center">
        <v-progress-circular v-if="backgroundLoading" indeterminate color="white" class="mr-2" />
        <span>{{ backgroundMessage }}</span>
      </div>
    </v-snackbar>

  </v-container>
</template>

<script>
import { apiClient } from '@/api'
import LearningPlanner from '@/components/LearningPlanner.vue'
import PlanDetailPanel from '@/components/PlanDetailPanel.vue'
import LessonDetailPanel from '@/components/LessonDetailPanel.vue'
import ProgressPage from '@/components/ProgressPage.vue'
import ShareStudyPlanDialog from '@/components/ShareStudyPlanDialog.vue'
import { eventBus } from '@/eventBus'
import { connection } from '@/services/signalr-service'
import { fetchEffectiveRole as fetchRole, getRole as getCachedRole, roleAllowsEdit, roleAllowsComment } from '@/services/studyplan-permissions'

export default {
  name: 'StudyPlanWorkspace',
  components: { LearningPlanner, PlanDetailPanel, LessonDetailPanel, ShareStudyPlanDialog, ProgressPage },
  data() {
    return {
      studyPlans: [],
      currentPlan: null,
      currentLesson: null,
      currentLessonId: null,
      drawer: true,
      collapsed: false,
      openSections: [0, 1, 2],
      aiDialog: false,
      editDialog: false,
      shareDialog: false,
      editPlan: null,
      isEditing: false,
      aiDirty: false,
      editDirty: false,
      // loading flags
      listLoading: false,
      detailLoading: false,
      // paging and filters for list endpoint
      page: 1,
      pageSize: 20,
      q: null,
      sort: null,
      listScope: 'mine',
      sortItems: [
        { title: '最近学习', value: 'recent' },
        { title: '创建时间', value: 'created' },
        { title: '热度', value: 'hot' },
      ],
      // my progress now handled in PlanDetailPanel
      roleMap: {},
      unsubscribers: [],
      affiliations: [],
      showProgressPage: false,
    }
  },
  computed: {
    backgroundGenerating() {
      return this.$store.state.backgroundGenerating
    },
  },
  async created() {
    await this.fetchPlans()
    const planId = this.$route.query.planId
    if (planId) {
      const selected = this.studyPlans.find(
        (p) => String(p.studyPlan.id) === String(planId)
      )
      if (selected) {
        await this.selectPlan(selected.studyPlan)
        await this.refreshEffectiveRole(selected.studyPlan.id)
      }
    } else if (!this.currentPlan && this.studyPlans.length) {
      // No planId provided: default to first plan in the list
      const first = this.studyPlans[0]?.studyPlan
      if (first?.id) {
        await this.selectPlan(first)
        await this.refreshEffectiveRole(first.id)
      }
    }
    // load affiliations for context bar when we have a plan
    if (this.currentPlan?.id) {
      this.fetchAffiliations(this.currentPlan.id)
    }
    // handle edit query param against permissions
    if (this.$route.query.edit === 'true' && this.currentPlan) {
      if (this.canEdit(this.currentPlan.id)) {
        this.startEdit(this.currentPlan)
      } else {
        alert('无权限编辑，已进入只读模式')
        this.$router.replace({ query: { ...this.$route.query, edit: undefined } })
      }
    }
    // setup SignalR listeners for permission-related events
    if (connection) {
      const onPermissionsUpdated = async (payload) => {
        try {
          const { planId: pid } = payload || {}
          if (!pid) return
          await this.refreshEffectiveRole(pid)
        } catch (e) {
          console.error('PermissionsUpdated handler failed', e)
        }
      }
      const onPlanLinked = onPermissionsUpdated
      const onPlanUnlinked = onPermissionsUpdated
      connection.on('PermissionsUpdated', onPermissionsUpdated)
      connection.on('PlanLinkedToGroup', onPlanLinked)
      connection.on('PlanUnlinkedFromGroup', onPlanUnlinked)
      this.unsubscribers.push(() => connection.off('PermissionsUpdated', onPermissionsUpdated))
      this.unsubscribers.push(() => connection.off('PlanLinkedToGroup', onPlanLinked))
      this.unsubscribers.push(() => connection.off('PlanUnlinkedFromGroup', onPlanUnlinked))
    }
  },
  beforeUnmount() {
    this.unsubscribers.forEach((fn) => fn && fn())
  },
  methods: {
    async fetchPlans() {
      this.listLoading = true
      try {
        const res = await apiClient.get('/StudyPlans', {
          params: {
            page: this.page,
            pageSize: this.pageSize,
            q: this.q,
            sort: this.sort,
            scope: this.listScope,
          },
        })
        // Expecting res.data to be an array of lightweight items with id, title, description, role
        const items = Array.isArray(res.data) ? res.data : res.data?.items || []
        this.studyPlans = items.map((item) => ({
          studyPlan: {
            id: item.id,
            title: item.title,
            // keep shape consistent; introduction used in center panel
            introduction: item.description ? { description: item.description } : null,
          },
        }))
        // Prime role map from list if role provided; otherwise, leave to permission service on demand
        items.forEach((item) => {
          if (item?.id && item?.role) this.roleMap[item.id] = item.role
        })

        // Fetch per-plan progress for current user; non-blocking best-effort
        const progressFetches = this.studyPlans.map(async (p) => {
          try {
            const pid = p?.studyPlan?.id
            if (!pid) return
            const resp = await apiClient.get(`/studyPlans/${pid}/progress/me`)
            const prog = resp?.data?.planProgress
            if (typeof prog === 'number') {
              p.studyPlan.progress = prog
            }
          } catch (_) {
            // ignore errors for individual progress requests
          }
        })
        // Allow progress requests to run in background without delaying list rendering
        Promise.allSettled(progressFetches)
          .catch(() => { /* no-op */ })
      } catch (e) {
        console.error('Error fetching study plans:', e)
      } finally {
        this.listLoading = false
      }
    },
    async fetchPlanDetailsById(planId) {
      // PlanDetailPanel handles fetching by planId; here we set minimal state
      this.detailLoading = false
      this.currentPlan = { id: planId }
      this.currentLesson = null
      this.currentLessonId = null
      this.fetchAffiliations(planId)
    },
    async fetchAffiliations(planId) {
      try {
        const res = await apiClient.get(`/studyPlans/${planId}/cohorts`)
        const cohorts = Array.isArray(res?.data) ? res.data : []
        const seen = new Map()
        cohorts.forEach(c => {
          if (!c.studyGroupId) return
          const key = String(c.studyGroupId)
          if (!seen.has(key)) seen.set(key, { groupId: c.studyGroupId, groupName: c.groupName || c.title || key, shareMode: c.shareMode || 'Editable' })
        })
        this.affiliations = Array.from(seen.values())
      } catch (e) {
        this.affiliations = []
      }
    },
    async refreshEffectiveRole(planId) {
      const role = await fetchRole(planId, { force: true })
      if (role) this.roleMap[planId] = role
    },
    getRole(planId) {
      return this.roleMap[planId] ?? getCachedRole(planId)
    },
    isOwner(planId) {
      return this.getRole(planId) === 'Owner'
    },
    canEdit(planId) {
      return roleAllowsEdit(this.getRole(planId))
    },
    canCommentOrProgress(planId) {
      return roleAllowsComment(this.getRole(planId))
    },
    async selectPlan(plan) {
      // Avoid reloading if selecting the same plan again (when not editing)
      if (
        this.currentPlan &&
        String(this.currentPlan.id) === String(plan.id) &&
        !this.isEditing
      ) {
        return
      }
      this.currentLesson = null
      this.isEditing = false
      // Fetch details on demand (lazy load)
      await this.fetchPlanDetailsById(plan.id)
      if (!this.getRole(plan.id)) {
        this.refreshEffectiveRole(plan.id)
      }
    },
    selectLesson(lesson) {
      this.currentLesson = lesson
      this.currentLessonId = lesson?.id || lesson?.name
      // Batch check completion status when resource IDs are present
      this.fetchLessonCompletedStatus(lesson)
    },
    selectLessonById(id, lesson) {
      this.currentLessonId = id
      // If we have the lesson object, pass it to avoid extra API in right panel
      this.currentLesson = lesson || null
    },
    onScopeChange(newScope) {
      this.scope = newScope
    },
    openCreateDialog() {
      if (this.backgroundGenerating) {
        alert('AI 正在生成学习计划，请稍后再试')
        return
      }
      this.editPlan = {
        title: '',
        introduction: { description: '' },
        prerequisite: [],
        mainCurriculum: [],
        advancedTopics: [],
      }
      this.editDirty = false
      this.editDialog = true
    },
    startEdit(plan) {
      if (!this.canEdit(plan.id)) {
        alert('无权限编辑该学习计划')
        return
      }
      // Ensure the selected plan matches the one being edited
      this.currentPlan = plan
      this.currentLesson = null
      // Deep copy to avoid mutating original until save
      this.editPlan = JSON.parse(JSON.stringify(plan))
      this.editDirty = false
      this.isEditing = true
    },
    cancelEditInCenter() {
      if (this.editDirty) {
        const ok = window.confirm('你在编辑中已有输入，确定要取消吗？未保存的内容将丢失。')
        if (!ok) return
      }
      this.isEditing = false
      this.editDirty = false
    },
    saveFromHeader() {
      // Call child form's save method
      if (this.$refs.editForm && this.$refs.editForm.saveStudyPlan) {
        this.$refs.editForm.saveStudyPlan()
      }
    },
    openAiDialog() {
      if (this.backgroundGenerating) {
        alert('AI 正在生成学习计划，请稍后再试')
        return
      }
      this.aiDialog = true
    },
    async saveStudyPlan(plan) {
      try {
        if (plan.id) {
          await apiClient.post('/StudyPlan/UpdateStudyPlan', {
            studyPlan: plan,
          })
        } else {
          await apiClient.post('/StudyPlan/SaveStudyPlan', { studyPlan: plan })
        }
        this.editDirty = false
        this.editDialog = false
        this.isEditing = false
        await this.fetchPlans()
        // Re-select the saved/updated plan in the list
        const id = plan.id
        if (id) {
          const selected = this.studyPlans.find(
            (p) => String(p.studyPlan.id) === String(id)
          )
          if (selected) this.selectPlan(selected.studyPlan)
          await this.refreshEffectiveRole(id)
        }
      } catch (e) {
        console.error('Error saving study plan:', e)
      }
    },
    async editPlanById(planId) {
      // Ensure user has edit rights and load full details before editing
      if (!this.canEdit(planId)) {
        alert('无权限编辑该学习计划')
        return
      }
      await this.fetchPlanDetailsById(planId)
      if (this.currentPlan) {
        this.startEdit(this.currentPlan)
      }
    },
    openShareDialog() {
      if (!this.currentPlan?.id) return
      this.shareDialog = true
    },
    async markResourceAsLearned(resource, lesson) {
      const wasLearned = resource.learned
      resource.learned = !wasLearned
      try {
        await apiClient.post(
          '/StudyPlan/LearningLessons/ToggleFinishedLearning',
          {
            name: lesson.name,
            resourceLink: resource.link,
          }
        )
        this.$store.commit('SET_LEARNING_STATUS', {
          lessonName: lesson.name,
          resourceLink: resource.link,
          learned: resource.learned,
        })
      } catch (e) {
        console.error('Error updating resource learned status:', e)
        resource.learned = wasLearned
      }
    },
    onResourceUpdated({ completed, resource }) {
      // keep local model in sync
      resource.learned = completed
      // refresh my overall progress
      if (this.currentPlan?.id) {
        this.fetchMyProgress(this.currentPlan.id)
      }
    },
    onAiDialogChange(val) {
      if (!val) {
        this.fetchPlans()
        this.aiDirty = false
      }
    },
    async fetchLessonCompletedStatus(lesson) {
      try {
        if (!lesson?.resources || lesson.resources.length === 0) return
        const ids = lesson.resources
          .map((r) => r.id || r.resourceId)
          .filter(Boolean)
        if (!ids.length) return
        const res = await apiClient.post('/resources/completedStatus', {
          resourceIds: ids,
        })
        const statusList = Array.isArray(res.data) ? res.data : []
        const map = new Map(statusList.map((s) => [String(s.resourceId), !!s.completed]))
        lesson.resources.forEach((r) => {
          const key = String(r.id || r.resourceId)
          if (map.has(key)) r.learned = map.get(key)
        })
      } catch (e) {
        console.error('Failed to fetch completedStatus for lesson', e)
      }
    },
    // 统一的关闭入口：只有点右下角按钮才会触发
    attemptClose(which) {
      if (which === 'ai') {
        if (this.aiDirty) {
          const ok = window.confirm('你在对话框中已有输入，确定要关闭吗？未保存的内容将丢失。')
          if (!ok) return
        }
        this.aiDialog = false
        this.aiDirty = false
      } else if (which === 'edit') {
        if (this.editDirty) {
          const ok = window.confirm('你在对话框中已有输入，确定要关闭吗？未保存的内容将丢失。')
          if (!ok) return
        }
        this.editDialog = false
        this.editDirty = false
      }
    },
    handleBackground(promise) {
      this.aiDialog = false
      this.aiDirty = false
      eventBus.emit('background-plan', promise)
      promise.then(() => this.fetchPlans())
    },
  },
  watch: {
    '$route.query.edit'(val) {
      if (!this.currentPlan) return
      if (val === 'true') {
        if (this.canEdit(this.currentPlan.id)) {
          this.startEdit(this.currentPlan)
        } else {
          alert('无权限编辑，已进入只读模式')
          this.$router.replace({ query: { ...this.$route.query, edit: undefined } })
        }
      } else if (val === undefined || val === null) {
        this.isEditing = false
      }
    },
  },
}
</script>

<style scoped>
.study-plan-workspace {
  height: calc(100vh - 64px);
  overflow: hidden;
}

/* Make the row fill the container's height */
.study-plan-workspace>.v-row {
  height: 100%;
}

.empty-plan-list { margin-top: 40px; }

/* Center panel header for the selected plan */
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
</style>
