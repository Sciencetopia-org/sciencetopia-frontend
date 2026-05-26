<template>
  <v-container fluid class="study-plan-workspace">
    <div v-if="isMobile" class="mobile-plan-workspace">
      <div class="mobile-plan-header">
        <div>
          <div class="mobile-plan-eyebrow">{{ $t('studyplan.myplans') }}</div>
          <div class="mobile-plan-title">{{ currentPlan?.title || $t('studyplan.myplans') }}</div>
        </div>
        <div class="mobile-plan-header__actions">
          <v-btn icon="mdi-plus" variant="text" size="small" @click="openCreateDialog"
            :disabled="backgroundGenerating || listLoading || detailLoading" />
          <v-btn icon="mdi-robot-outline" variant="text" size="small" @click="openAiDialog"
            :disabled="backgroundGenerating || listLoading || detailLoading" />
          <v-btn
            v-if="mobileTab === 'detail' && currentPlan?.id && canEdit(currentPlan.id)"
            icon="mdi-cog-outline"
            variant="text"
            size="small"
            :disabled="listActionLocked"
            @click="openSettingsById(currentPlan.id)"
          />
        </div>
      </div>

      <div class="mobile-plan-swipe-indicator" :aria-label="mobileTabLabel">
        <button
          v-for="item in mobileSwipeItems"
          :key="item.value"
          type="button"
          class="mobile-plan-dot"
          :class="{ 'mobile-plan-dot--active': mobileTab === item.value }"
          @click="goToMobileTab(item.value)"
          :aria-label="item.label"
        />
      </div>

      <div
        class="mobile-plan-window"
        @touchstart.passive="onMobileSwipeStart"
        @touchmove.passive="onMobileSwipeMove"
        @touchend="onMobileSwipeEnd"
        @touchcancel="onMobileSwipeCancel"
      >
        <div
          class="mobile-plan-track"
          :class="{ 'mobile-plan-track--dragging': mobileSwipeDragging }"
          :style="mobileTrackStyle"
        >
        <section class="mobile-plan-pane">
          <v-card class="mobile-plan-card" rounded="lg" elevation="1">
            <div class="mobile-plan-controls">
              <v-text-field
                v-model="q"
                :label="$t('common.search')"
                density="compact"
                hide-details
                clearable
                append-inner-icon="mdi-magnify"
                :disabled="listLoading || detailLoading"
                :loading="listLoading"
                @click:append-inner="fetchPlans"
                @keyup.enter="fetchPlans"
                @click:clear="fetchPlans"
              />
              <StudyPlanProgressFilter
                v-model="progressStatus"
                :disabled="listLoading || detailLoading"
                @update:model-value="onListControlsChanged"
              />
            </div>
            <div class="mobile-plan-scroll">
              <template v-if="listLoading">
                <v-skeleton-loader type="list-item" v-for="n in 4" :key="n" />
              </template>
              <v-list v-else-if="studyPlans.length" density="compact" class="plan-list">
                <v-list-item
                  v-for="plan in studyPlans"
                  :key="plan.studyPlan.id"
                  @click="selectPlan(plan.studyPlan); goToMobileTab('lessons')"
                  class="plan-card"
                  :disabled="listActionLocked"
                  :class="{ 'selected-plan': currentPlan && currentPlan.id === plan.studyPlan.id }"
                >
                  <div class="title">{{ plan.studyPlan.title }}</div>
                  <PlanProgressBars
                    :loading="progressLoading[plan.studyPlan.id]"
                    :primaryProgress="plan.studyPlan.progress"
                    :advancedProgress="plan.studyPlan.advancedProgress"
                    :primaryTooltip="$t('studyplan.progressTooltip', { percent: Math.round(plan.studyPlan.progress || 0) })"
                    :advancedTooltip="$t('studyplan.advancedProgressTooltip', { percent: Math.round(plan.studyPlan.advancedProgress || 0) })"
                  />
                </v-list-item>
              </v-list>
              <div v-else class="empty-plan-list text-center px-4">
                <p class="mb-4">{{ $t(emptyPlanMessageKey) }}</p>
                <v-btn block class="mb-2" color="primary" @click="openCreateDialog" :disabled="backgroundGenerating || listLoading || detailLoading">
                  {{ $t('studyplan.create') }}
                </v-btn>
                <v-btn block color="secondary" @click="openAiDialog" :disabled="backgroundGenerating || listLoading || detailLoading">
                  {{ $t('studyplan.aiGenerate') }}
                </v-btn>
              </div>
            </div>
          </v-card>
        </section>

        <section class="mobile-plan-pane">
          <div class="mobile-plan-scroll">
            <PlanDetailPanel ref="centerPanel" v-if="currentPlan?.id" :key="`m-plan:${currentPlan.id}`" :planId="currentPlan.id" :scope="scope" :allowEditControls="true"
              @select-lesson="selectLessonById" @open-share="openShareDialog" @open-progress="mobileProgressSheet = true"
              @updated-plan="onCenterUpdated" @loaded="onCenterLoaded" @open-settings="openSettingsFromPanel" />
          </div>
        </section>

        <section class="mobile-plan-pane">
          <div class="mobile-plan-scroll">
            <LessonDetailPanel ref="rightPanel"
              v-if="currentLesson || currentLessonId"
              :key="`m-lesson:${currentPlan?.id || 'none'}:${currentLessonId || currentLesson?.id || currentLesson?.name || 'selected'}`"
              :planId="currentPlan?.id"
              :lesson="currentLesson"
              :lessonId="currentLessonId"
              :scope="scope"
              :canInteract="canProgressOnCurrentPlan"
              :disabled="!canProgressOnCurrentPlan"
              @resource-updated="onResourceUpdated"
            />
            <v-card v-else class="panel-card panel-card--beige pa-4" rounded="lg" elevation="1">
              <div class="placeholder">{{ $t('lessonDetail.selectLesson') }}</div>
            </v-card>
          </div>
        </section>
        </div>
      </div>

      <v-bottom-sheet v-model="mobileProgressSheet" class="mobile-progress-sheet">
        <div class="mobile-progress-sheet__content">
          <ProgressPage
            v-if="currentPlan?.id"
            :planId="currentPlan?.id"
            @close="mobileProgressSheet = false"
            @select-lesson="selectLessonFromProgress"
          />
        </div>
      </v-bottom-sheet>
    </div>

    <v-row v-else>
      <!-- Left: study plan list -->
      <v-col :cols="collapsed ? 1 : 3" class="pa-0">
        <v-card rounded="xl" elevation="2" class="left-panel">
          <div class="plan-list-header d-flex align-center px-4 py-2">
            <span class="text-h6">{{ $t('studyplan.myplans') }}</span>
            <v-spacer />
            <v-btn :aria-label="$t('studyplan.create')" icon="mdi-plus" variant="text" @click="openCreateDialog"
              :disabled="backgroundGenerating || listLoading || detailLoading" />
            <v-btn :aria-label="$t('studyplan.aiGenerate')" icon="mdi-robot-outline" variant="text"
              @click="openAiDialog" :disabled="backgroundGenerating || listLoading || detailLoading" />
          </div>
          <v-divider />
          <!-- <v-tabs v-model="listScope" density="compact" class="px-2">
            <v-tab value="mine">{{ $t('studyplan.tabs.mine') }}</v-tab>
            <v-tab value="shared">{{ $t('studyplan.tabs.shared') }}</v-tab>
            <v-tab value="public">{{ $t('studyplan.tabs.public') }}</v-tab>
          </v-tabs> -->
          <div class="d-flex align-center px-3 pb-2 gap-2">
            <v-text-field
              v-model="q"
              :label="$t('common.search')"
              density="compact"
              hide-details
              clearable
              append-inner-icon="mdi-magnify"
              :disabled="listLoading || detailLoading"
              :loading="listLoading"
              @click:append-inner="fetchPlans"
              @keyup.enter="fetchPlans"
              @click:clear="fetchPlans"
            />
            <v-select v-model="sort" :items="sortItems" :label="$t('common.sort')" density="compact" hide-details
              :disabled="listLoading || detailLoading"
              style="max-width: 200px" @update:model-value="onListControlsChanged" />
          </div>
          <div class="px-3 pb-2">
            <StudyPlanProgressFilter
              v-model="progressStatus"
              :disabled="listLoading || detailLoading"
              @update:model-value="onListControlsChanged"
            />
          </div>
          <!-- <v-divider /> -->
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
                :disabled="listActionLocked"
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
                      icon="mdi-cog-outline"
                      variant="text"
                      density="comfortable"
                      @click.stop="openSettingsById(plan.studyPlan.id)"
                      :disabled="listActionLocked"
                      :aria-label="`${$t('setting')} ${plan.studyPlan.title}`"
                    />
                  </div>
                </div>
                <PlanProgressBars
                  :loading="progressLoading[plan.studyPlan.id]"
                  :primaryProgress="plan.studyPlan.progress"
                  :advancedProgress="plan.studyPlan.advancedProgress"
                  :primaryTooltip="$t('studyplan.progressTooltip', { percent: Math.round(plan.studyPlan.progress || 0) })"
                  :advancedTooltip="$t('studyplan.advancedProgressTooltip', { percent: Math.round(plan.studyPlan.advancedProgress || 0) })"
                />
              </v-list-item>
            </v-list>
          </template>
          <div v-else class="empty-plan-list text-center px-4">
            <p class="mb-4">{{ $t(emptyPlanMessageKey) }}</p>
            <v-btn block class="mb-2" color="primary" @click="openCreateDialog" :disabled="backgroundGenerating || listLoading || detailLoading">
              {{ $t('studyplan.create') }}
            </v-btn>
            <v-btn block color="secondary" @click="openAiDialog" :disabled="backgroundGenerating || listLoading || detailLoading">
              {{ $t('studyplan.aiGenerate') }}
            </v-btn>
          </div>
          <div class="d-flex justify-end pa-2">
            <v-btn v-if="!collapsed" variant="plain" icon="mdi-menu-open" @click="collapsed = !collapsed" />
            <v-btn v-else variant="plain" icon="mdi-menu-close" @click="collapsed = !collapsed" />
          </div>
        </v-card>
      </v-col>

      <!-- Middle + Right (default): Plan and Lesson panels -->
      <template v-if="!showProgressPage">
        <v-col :cols="collapsed ? 6 : 5" class="center-panel">
          <!-- <PlanContextBar v-if="currentPlan?.id" :scope="scope" :groups="affiliations" @change="onScopeChange"
            @open-group="(gid) => $router.push({ name: 'GroupPlanWorkspace', params: { groupId: gid, planId: currentPlan.id } })" /> -->
          <PlanDetailPanel ref="centerPanel" v-if="currentPlan?.id" :key="`plan:${currentPlan.id}`" :planId="currentPlan.id" :scope="scope" :allowEditControls="true"
            @select-lesson="selectLessonById" @open-share="openShareDialog" @open-progress="showProgressPage = true"
            @updated-plan="onCenterUpdated" @loaded="onCenterLoaded" @open-settings="openSettingsFromPanel" />
          <!-- 未选择计划时不显示占位条 -->
          <template v-else></template>
        </v-col>

        <!-- Right: Lesson detail panel -->
        <v-col :cols="collapsed ? 5 : 4" class="right-panel">
          <LessonDetailPanel ref="rightPanel"
            v-if="currentLesson || currentLessonId"
            :key="`lesson:${currentPlan?.id || 'none'}:${currentLessonId || currentLesson?.id || currentLesson?.name || 'selected'}`"
            :planId="currentPlan?.id"
            :lesson="currentLesson"
            :lessonId="currentLessonId"
            :scope="scope"
            :canInteract="canProgressOnCurrentPlan"
            :disabled="!canProgressOnCurrentPlan"
            @resource-updated="onResourceUpdated"
          />
        </v-col>
      </template>

      <!-- ProgressPage occupying middle + right columns -->
      <template v-else>
        <v-col :cols="collapsed ? 11 : 9" class="center-panel">
          <ProgressPage :planId="currentPlan?.id" @close="showProgressPage = false" @select-lesson="selectLessonFromProgress" />
        </v-col>
      </template>
    </v-row>

    <!-- AI planner dialog -->
    <v-dialog
      v-model="aiDialog"
      :max-width="isMobile ? '100%' : 800"
      :fullscreen="isMobile"
      theme="light"
      persistent
      scrollable
      @update:model-value="onAiDialogChange"
    >
      <v-card class="sc-dialog-card study-plan-form-dialog-card" color="white" rounded="xl">
        <v-card-title class="text-h6">{{ $t('studyplan.ai.plannerTitle') }}</v-card-title>
        <v-card-text class="sc-dialog-body study-plan-form-dialog-body">
          <!-- 子组件在任一输入变化时 $emit('dirty') -->
          <LearningPlanner @dirty="aiDirty = true" @background="handleBackground" />
        </v-card-text>
        <v-card-actions class="justify-end study-plan-form-dialog-actions">
          <v-btn variant="text" @click="attemptClose('ai')">{{ $t('close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit / create dialog -->
    <v-dialog
      v-model="editDialog"
      :max-width="isMobile ? '100%' : 800"
      :fullscreen="isMobile"
      theme="light"
      persistent
      scrollable
    >
      <v-card class="sc-dialog-card study-plan-form-dialog-card" color="white" rounded="xl">
        <v-card-title class="text-h6">{{ $t(editPlan && editPlan.id ? 'studyplan.dialogs.editTitle' : 'studyplan.dialogs.createTitle') }}</v-card-title>
        <v-card-text class="sc-dialog-body study-plan-form-dialog-body">
          <!-- 子组件在任一输入变化时 $emit('dirty') -->
          <EditStudyPlanForm :studyPlan="editPlan" :saving="saving" @save="saveStudyPlan" @dirty="editDirty = true" />
        </v-card-text>
        <v-card-actions class="justify-end study-plan-form-dialog-actions">
          <v-btn variant="text" @click="attemptClose('edit')">{{ $t('close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Share dialog -->
    <ShareStudyPlanDialog
      v-model="shareDialog"
      v-if="currentPlan?.id"
      :planId="currentPlan.id"
      :planStableId="currentPlan.stableId"
      @permissions-updated="onSharePermissionsUpdated"
    />

    <StudyPlanSettingsDialog
      v-model="settingsDialog"
      v-if="settingsPlan"
      :plan="settingsPlan"
      :canEdit="settingsCanEdit"
      :canDelete="settingsCanDelete"
      :saving="saving"
      @save="saveStudyPlan"
      @deleted="onPlanDeleted"
      @dirty="editDirty = true"
    />

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
import PlanProgressBars from '@/components/common/PlanProgressBars.vue'
import LearningPlanner from '@/components/study-plan/LearningPlanner.vue'
import PlanContextBar from '@/components/study-plan/PlanContextBar.vue'
import PlanDetailPanel from '@/components/study-plan/PlanDetailPanel.vue'
import LessonDetailPanel from '@/components/study-plan/LessonDetailPanel.vue'
import ProgressPage from '@/components/study-plan/ProgressPage.vue'
import ShareStudyPlanDialog from '@/components/study-plan/ShareStudyPlanDialog.vue'
import StudyPlanSettingsDialog from '@/components/study-plan/StudyPlanSettingsDialog.vue'
import EditStudyPlanForm from '@/components/study-plan/EditStudyPlanForm.vue'
import StudyPlanProgressFilter from '@/components/study-plan/StudyPlanProgressFilter.vue'
import { eventBus } from '@/eventBus'
import { connection } from '@/services/signalr-service'
import { fetchEffectiveRole as fetchRole, getRole as getCachedRole, roleAllowsEdit, roleAllowsProgress } from '@/services/studyplan-permissions'
import { isPhoneDevice, phoneDeviceRevision } from '@/utils/device'
import confetti from 'canvas-confetti'

export default {
  name: 'StudyPlanWorkspace',
  components: { LearningPlanner, PlanContextBar, PlanDetailPanel, LessonDetailPanel, ShareStudyPlanDialog, StudyPlanSettingsDialog, ProgressPage, EditStudyPlanForm, PlanProgressBars, StudyPlanProgressFilter },
  data() {
    return {
      studyPlans: [],
      currentPlan: null,
      currentLesson: null,
      currentLessonId: null,
      mobileTab: 'plans',
      mobileProgressSheet: false,
      mobileSwipeStartX: 0,
      mobileSwipeStartY: 0,
      mobileSwipeDeltaX: 0,
      mobileSwipeDragging: false,
      drawer: true,
      collapsed: false,
      openSections: [0, 1, 2],
      aiDialog: false,
      editDialog: false,
      shareDialog: false,
      settingsDialog: false,
      editPlan: null,
      settingsPlan: null,
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
      sort: 'lastStudiedDesc',
      progressStatus: 'all',
      listScope: 'mine',
      scope: { type: 'me' },
      // my progress now handled in PlanDetailPanel
      roleMap: {},
      unsubscribers: [],
      affiliations: [],
      showProgressPage: false,
      saving: false,
      // per-plan loading flag for progress bars
      progressLoading: {},
    }
  },
  computed: {
    listActionLocked() {
      return this.listLoading || this.detailLoading || this.backgroundGenerating
    },
    canProgressOnCurrentPlan() {
      return !!this.currentPlan?.id && !this.listLoading
    },
    settingsCanEdit() {
      return !!this.settingsPlan?.id && this.canEdit(this.settingsPlan.id)
    },
    settingsCanDelete() {
      return !!this.settingsPlan?.id && this.isOwner(this.settingsPlan.id)
    },
    emptyPlanMessageKey() {
      if (this.progressStatus === 'inProgress') return 'studyplan.noInProgressPlans'
      if (this.progressStatus === 'completed') return 'studyplan.noCompletedPlans'
      return 'studyplan.noPlansYet'
    },
    backgroundGenerating() {
      return this.$store.state.backgroundGenerating
    },
    isMobile() {
      phoneDeviceRevision.value
      return isPhoneDevice()
    },
    sortItems() {
      return [
        { title: this.$t('common.sortOptions.progressDesc'), value: 'progressDesc' },
        { title: this.$t('common.sortOptions.progressAsc'), value: 'progressAsc' },
        { title: this.$t('common.sortOptions.lastStudiedDesc'), value: 'lastStudiedDesc' },
        { title: this.$t('common.sortOptions.updatedDesc'), value: 'updatedDesc' },
      ]
    },
    mobileSwipeItems() {
      return [
        { value: 'plans', label: this.$t('studyplan.myplans') },
        { value: 'lessons', label: this.$t('studyplan.lessons') || 'Lessons' },
        { value: 'resource', label: this.$t('studyplan.resource') || 'Resource' },
      ]
    },
    mobileTabLabel() {
      return this.mobileSwipeItems.find((item) => item.value === this.mobileTab)?.label || ''
    },
    mobileTabIndex() {
      return Math.max(0, this.mobileSwipeItems.findIndex((item) => item.value === this.mobileTab))
    },
    mobileTrackStyle() {
      const pagePercent = 100 / Math.max(1, this.mobileSwipeItems.length)
      const base = -this.mobileTabIndex * pagePercent
      const drag = this.mobileSwipeDragging ? this.mobileSwipeDeltaX : 0
      return {
        transform: `translate3d(calc(${base}% + ${drag}px), 0, 0)`,
      }
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
        alert(this.$t('studyplan.dialogs.noEditPermission'))
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
    goToMobileTab(value) {
      if (!this.mobileSwipeItems.some((item) => item.value === value)) return
      this.mobileTab = value
      this.mobileSwipeDragging = false
      this.mobileSwipeDeltaX = 0
    },
    onMobileSwipeStart(event) {
      const touch = event.touches?.[0]
      if (!touch) return
      this.mobileSwipeStartX = touch.clientX
      this.mobileSwipeStartY = touch.clientY
      this.mobileSwipeDeltaX = 0
      this.mobileSwipeDragging = true
    },
    onMobileSwipeMove(event) {
      if (!this.mobileSwipeDragging) return
      const touch = event.touches?.[0]
      if (!touch) return
      const deltaX = touch.clientX - this.mobileSwipeStartX
      const deltaY = touch.clientY - this.mobileSwipeStartY
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
        this.mobileSwipeDeltaX = 0
        return
      }
      const atFirst = this.mobileTabIndex === 0 && deltaX > 0
      const atLast = this.mobileTabIndex === this.mobileSwipeItems.length - 1 && deltaX < 0
      this.mobileSwipeDeltaX = atFirst || atLast ? deltaX * 0.28 : deltaX
    },
    onMobileSwipeEnd() {
      if (!this.mobileSwipeDragging) return
      const threshold = 64
      const index = this.mobileTabIndex
      if (this.mobileSwipeDeltaX <= -threshold && index < this.mobileSwipeItems.length - 1) {
        this.mobileTab = this.mobileSwipeItems[index + 1].value
      } else if (this.mobileSwipeDeltaX >= threshold && index > 0) {
        this.mobileTab = this.mobileSwipeItems[index - 1].value
      }
      this.mobileSwipeDragging = false
      this.mobileSwipeDeltaX = 0
    },
    onMobileSwipeCancel() {
      this.mobileSwipeDragging = false
      this.mobileSwipeDeltaX = 0
    },
    async fetchPlans({ reconcileSelection = false } = {}) {
      if (this.listLoading) return
      this.listLoading = true
      let loaded = false
      try {
        const res = await apiClient.get('/StudyPlans', {
          params: {
            page: this.page,
            pageSize: this.pageSize,
            q: this.q,
            sort: this.sort,
            scope: this.listScope,
            progressStatus: this.progressStatus,
            targetUserId:
              this.$store.state.currentUserID || this.$store.state.userInfo?.id,
          },
        })
        // Expecting res.data to be an array of lightweight items with id, title, description, role
        const items = Array.isArray(res.data) ? res.data : res.data?.items || []
        this.studyPlans = items.map((item) => {
          const stableId = item.stableId || item.StableId || item.stableID
          const versionNumber = item.versionNumber || item.VersionNumber || 1
          const latestVersionNumber = item.latestVersionNumber || item.LatestVersionNumber || versionNumber
          const currentVersionNumber = item.currentVersionNumber || item.CurrentVersionNumber || latestVersionNumber
          const isCurrent = item.isCurrent ?? item.IsCurrent ?? (versionNumber === currentVersionNumber)
          const hasUpgrade = item.hasUpgrade ?? item.HasUpgrade ?? (!isCurrent && versionNumber < latestVersionNumber)
          const description = item.description ?? item.Description ?? ''
          const lastStudiedAt = item.lastStudiedAt ?? item.LastStudiedAt ?? null
          const updatedAt = item.updatedAt ?? item.UpdatedAt ?? null

          return {
            studyPlan: {
              id: item.id || item.Id,
              stableId,
              versionNumber,
              latestVersionNumber,
              currentVersionNumber,
              isCurrent,
              hasUpgrade,
              status: item.status || item.Status || (isCurrent ? 'Current' : 'Archived'),
              title: item.title || item.Title,
              introduction: description ? { description } : null,
              updatedAt,
              lastStudiedAt,
              progress: typeof item.progress === 'number'
                ? (item.progress <= 1 ? item.progress * 100 : item.progress)
                : undefined,
              advancedProgress: (() => {
                const val =
                  (typeof item.advancedTopicProgressPercentage === 'number' ? item.advancedTopicProgressPercentage : undefined) ??
                  (typeof item.advancedProgress === 'number' ? item.advancedProgress : undefined) ??
                  (typeof item.extraProgress === 'number' ? item.extraProgress : undefined)
                if (typeof val !== 'number') return 0
                return val <= 1 ? val * 100 : val
              })(),
            },
          }
        })
        // Prime role map from list if role provided; otherwise, leave to permission service on demand
        items.forEach((item) => {
          const id = item.id || item.Id
          if (id && item?.role) this.roleMap[id] = item.role
        })
        loaded = true

      } catch (e) {
        console.error('Error fetching study plans:', e)
      } finally {
        this.listLoading = false
      }
      if (loaded && reconcileSelection) {
        await this.reconcileSelectionAfterListRefresh()
      }
    },
    async onListControlsChanged() {
      this.page = 1
      await this.fetchPlans({ reconcileSelection: true })
    },
    async reconcileSelectionAfterListRefresh() {
      const currentId = this.currentPlan?.id
      const visibleCurrent = currentId
        ? this.studyPlans.find((p) => String(p?.studyPlan?.id) === String(currentId))
        : null

      if (visibleCurrent?.studyPlan) {
        this.currentPlan = { ...this.currentPlan, ...visibleCurrent.studyPlan }
        return
      }

      this.currentPlan = null
      this.currentLesson = null
      this.currentLessonId = null
      this.showProgressPage = false
      this.affiliations = []

      const first = this.studyPlans[0]?.studyPlan
      if (first?.id) {
        await this.selectPlan(first)
        await this.refreshEffectiveRole(first.id)
      }
    },
    async refreshPlanProgress(planId, { silent } = { silent: false }) {
      // Preferred: use backend endpoint; Fallback: local compute if unavailable
      try {
        if (!planId) return
        this.$set ? this.$set(this.progressLoading, planId, true) : (this.progressLoading[planId] = true)
        const resp = await apiClient.get(`/StudyPlans/${planId}/Progress/Me`)
        const raw = resp?.data?.planProgress
        const advRaw = resp?.data?.advancedTopicProgress
        if (typeof raw !== 'number') throw new Error('invalid planProgress')
        const value = raw <= 1 ? raw * 100 : raw
        const advValue = typeof advRaw === 'number' ? (advRaw <= 1 ? advRaw * 100 : advRaw) : 0
        const idx = this.studyPlans.findIndex(sp => String(sp?.studyPlan?.id) === String(planId))
        if (idx >= 0) {
          this.studyPlans[idx].studyPlan.progress = Math.round(value)
          this.studyPlans[idx].studyPlan.advancedProgress = Math.round(advValue)
        }
        if (this.currentPlan && String(this.currentPlan.id) === String(planId)) {
          this.currentPlan.progress = Math.round(value)
        }
      } catch (e) {
        if (!silent) console.warn('Falling back to local compute for plan progress', e)
        await this.computePlanProgress(planId, { silent: true })
      } finally {
        this.$set ? this.$set(this.progressLoading, planId, false) : (this.progressLoading[planId] = false)
      }
    },
    async computePlanProgress(planId, { silent } = { silent: false }) {
      try {
        if (!planId) return
        this.$set ? this.$set(this.progressLoading, planId, true) : (this.progressLoading[planId] = true)
        // Fetch plan details to aggregate resources
        const res = await apiClient.get('/StudyPlan/GetStudyPlanById', { params: { studyPlanId: planId } })
        const plan = res?.data?.studyPlan || res?.data
        if (!plan) return

        const sectionsBasic = ['prerequisite', 'mainCurriculum']
        const sectionAdv = ['advancedTopics']

        const collectIds = (secs) => {
          const ids = []
          secs.forEach(sec => {
            const list = Array.isArray(plan[sec]) ? plan[sec] : []
            list.forEach(lesson => {
              const resources = Array.isArray(lesson?.resources) ? lesson.resources : []
              resources.forEach(r => {
                const id = r?.id || r?.resourceId
                if (id) ids.push(id)
              })
            })
          })
          return ids
        }

        const basicIds = collectIds(sectionsBasic)
        const advIds = collectIds(sectionAdv)

        async function fetchCompleted(ids) {
          if (!ids || ids.length === 0) return { total: 0, completed: 0 }
          // chunk to avoid payload too large
          const chunkSize = 200
          let completed = 0
          for (let i = 0; i < ids.length; i += chunkSize) {
            const slice = ids.slice(i, i + chunkSize)
            try {
              const r = await apiClient.post('/resources/completedStatus', { resourceIds: slice })
              const arr = Array.isArray(r?.data) ? r.data : []
              completed += arr.reduce((acc, x) => acc + (x?.completed ? 1 : 0), 0)
            } catch (_) {
              // ignore individual chunk errors
            }
          }
          return { total: ids.length, completed }
        }

        const [basic, adv] = await Promise.all([fetchCompleted(basicIds), fetchCompleted(advIds)])
        const basicPct = basic.total > 0 ? (basic.completed / basic.total) * 100 : 0
        const advPct = adv.total > 0 ? (adv.completed / adv.total) * 100 : 0

        const idx = this.studyPlans.findIndex(sp => String(sp?.studyPlan?.id) === String(planId))
        if (idx >= 0) {
          this.studyPlans[idx].studyPlan.progress = Math.round(basicPct)
          this.studyPlans[idx].studyPlan.advancedProgress = Math.round(advPct)
        }
        if (this.currentPlan && String(this.currentPlan.id) === String(planId)) {
          this.currentPlan.progress = Math.round(basicPct)
        }
      } catch (e) {
        if (!silent) console.error('Failed to compute plan progress', e)
      } finally {
        this.$set ? this.$set(this.progressLoading, planId, false) : (this.progressLoading[planId] = false)
      }
    },
    async fetchPlanDetailsById(planId) {
      // PlanDetailPanel handles fetching by planId; here we set minimal state
      this.detailLoading = true
      const match = this.studyPlans.find(p => String(p?.studyPlan?.id) === String(planId))
      if (match?.studyPlan) {
        this.currentPlan = { ...match.studyPlan }
      } else {
        this.currentPlan = { id: planId }
      }
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
      return roleAllowsProgress(this.getRole(planId))
    },
    async selectPlan(plan) {
      if (this.listActionLocked || !plan?.id) return
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
    },
    selectLessonById(id, lesson) {
      this.currentLessonId = id
      // If we have the lesson object, pass it to avoid extra API in right panel
      this.currentLesson = lesson || null
      if (this.isMobile) this.mobileTab = 'resource'
    },
    selectLessonFromProgress(id) {
      this.showProgressPage = false
      this.mobileProgressSheet = false
      this.currentLessonId = id
      this.currentLesson = null
      if (this.isMobile) this.mobileTab = 'resource'
    },
    onScopeChange(newScope) {
      this.scope = newScope
    },
    openCreateDialog() {
      if (this.backgroundGenerating || this.listLoading || this.detailLoading) {
        alert(this.$t('studyplan.ai.generatingTryLater'))
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
        alert(this.$t('studyplan.dialogs.noEditPermissionShort'))
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
        const ok = window.confirm(this.$t('studyplan.dialogs.confirmCloseWithUnsaved'))
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
      if (this.backgroundGenerating || this.listLoading || this.detailLoading) {
        alert(this.$t('studyplan.ai.generatingTryLater'))
        return
      }
      this.aiDialog = true
    },
    async loadFullPlan(planId) {
      const res = await apiClient.get('/StudyPlan/GetStudyPlanById', { params: { studyPlanId: planId } })
      return res?.data?.studyPlan || res?.data || null
    },
    async openSettingsById(planId) {
      if (this.listActionLocked || !planId) return
      if (!this.getRole(planId)) {
        await this.refreshEffectiveRole(planId)
      }
      if (!this.canEdit(planId)) {
        alert(this.$t('studyplan.dialogs.noEditPermissionShort'))
        return
      }
      try {
        this.detailLoading = true
        const plan = await this.loadFullPlan(planId)
        if (!plan) throw new Error('Study plan not found')
        this.settingsPlan = plan
        this.settingsDialog = true
        this.editDirty = false
        if (!this.currentPlan || String(this.currentPlan.id) !== String(planId)) {
          this.currentPlan = { ...plan }
        }
      } catch (error) {
        console.error('Failed to open study plan settings:', error)
        alert(this.$t('operationfailedmsg3'))
      } finally {
        this.detailLoading = false
      }
    },
    openSettingsFromPanel(plan) {
      const planId = plan?.id || this.currentPlan?.id
      if (planId) this.openSettingsById(planId)
    },
    async saveStudyPlan(plan) {
      try {
        this.saving = true
        let createdId = null
        const tagPayload = plan.__tags || null
        const studyPlan = { ...plan }
        delete studyPlan.__tags
        if (studyPlan.id) {
          await apiClient.post('/StudyPlan/UpdateStudyPlan', { studyPlan })
        } else {
          const resp = await apiClient.post('/StudyPlan/SaveStudyPlan', { studyPlan })
          createdId = resp?.data?.studyPlanId
          if (createdId) studyPlan.id = createdId
        }
        this.editDirty = false
        this.editDialog = false
        this.settingsDialog = false
        this.settingsPlan = null
        this.isEditing = false
        await this.fetchPlans()
        // Re-select the saved/updated plan in the list
        const id = studyPlan.id || createdId
        if (id) {
          const selected = this.studyPlans.find(
            (p) => String(p.studyPlan.id) === String(id)
          )
          if (selected) this.selectPlan(selected.studyPlan)
          await this.refreshEffectiveRole(id)
          // Update tags if provided
          if (tagPayload) {
            try {
              const planNames = Array.isArray(tagPayload.planTagNames) ? tagPayload.planTagNames : []
              if (planNames.length) await apiClient.post(`/StudyPlanTags/${id}/Tags`, { newTagNames: planNames })
              // Map lesson keys to Ids after fetching full plan detail
              const detail = await apiClient.get('/StudyPlan/GetStudyPlanById', { params: { studyPlanId: id } })
              const sp = detail?.data?.studyPlan || detail?.data
              if (sp) {
                const map = {}
                const secs = ['prerequisite', 'mainCurriculum', 'advancedTopics']
                secs.forEach(sec => {
                  const list = Array.isArray(sp[sec]) ? sp[sec] : []
                  list.forEach((l, idx) => {
                    const key1 = l?.id || `${sec}:${idx}:${l?.name}`
                    map[key1] = l?.id
                  })
                })
                const lessons = tagPayload.lessonTagNames || {}
                for (const key in lessons) {
                  const names = lessons[key]
                  const lid = map[key]
                  if (!lid || !Array.isArray(names) || !names.length) continue
                  await apiClient.post(`/StudyPlanTags/${id}/Lessons/${encodeURIComponent(lid)}/Tags`, { newTagNames: names })
                }
              }
            } catch (e) { /* ignore tag errors */ }
          }
          // Refresh center and right panels to reflect new tags without page reload
          this.$nextTick(() => {
            try { this.$refs.centerPanel && this.$refs.centerPanel.loadPlan && this.$refs.centerPanel.loadPlan() } catch (_) {}
            try { this.$refs.rightPanel && this.$refs.rightPanel.fetchLessonById && this.$refs.rightPanel.fetchLessonById() } catch (_) {}
          })
        }
      } catch (e) {
        console.error('Error saving study plan:', e)
      } finally { this.saving = false }
    },
    async onPlanDeleted(plan) {
      alert(this.$t('studyplan.deletesuccess'))
      const deletedId = plan?.id
      this.settingsDialog = false
      this.settingsPlan = null
      if (deletedId && this.currentPlan && String(this.currentPlan.id) === String(deletedId)) {
        this.currentPlan = null
        this.currentLesson = null
        this.currentLessonId = null
        this.showProgressPage = false
      }
      await this.fetchPlans({ reconcileSelection: true })
      if (this.isMobile) this.mobileTab = 'plans'
    },
    onCenterUpdated(p) {
      if (p) this.currentPlan = p
      // Ensure tags are refreshed in UI immediately
      this.$nextTick(() => {
        try { this.$refs.centerPanel && this.$refs.centerPanel.loadPlan && this.$refs.centerPanel.loadPlan() } catch (_) {}
        try { this.$refs.rightPanel && this.$refs.rightPanel.fetchLessonById && this.$refs.rightPanel.fetchLessonById() } catch (_) {}
      })
    },
    onCenterLoaded(p) {
      this.detailLoading = false
      if (!p || !this.currentPlan?.id) return
      this.currentPlan = {
        ...this.currentPlan,
        ...p,
        id: p.id || this.currentPlan.id,
        stableId: p.stableId || this.currentPlan.stableId,
      }
    },
    onSharePermissionsUpdated() {
      const planId = this.currentPlan?.id
      if (!planId) return
      this.refreshEffectiveRole(planId)
      this.$nextTick(() => {
        try { this.$refs.centerPanel && this.$refs.centerPanel.refreshRole && this.$refs.centerPanel.refreshRole() } catch (_) {}
      })
    },
    async editPlanById(planId) {
      if (this.listActionLocked) return
      // Ensure user has edit rights and load full details before editing
      if (!this.canEdit(planId)) {
        alert(this.$t('studyplan.dialogs.noEditPermissionShort'))
        return
      }
      await this.fetchPlanDetailsById(planId)
      if (this.currentPlan) {
        this.startEdit(this.currentPlan)
      }
    },
    openShareDialog() {
      if (this.detailLoading || !this.currentPlan?.id) return
      this.shareDialog = true
    },
    onResourceUpdated({ completed, resource, planProgress, lessonProgress, phase }) {
      // keep local model in sync
      resource.learned = completed
      const planId = this.currentPlan?.id
      const panel = this.$refs && this.$refs.centerPanel
      const currentLessonId = this.currentLessonId
      if (!planId) return

      if (phase === 'optimistic') {
        // Show skeletons only; defer network fetch to confirmed event
        if (panel && typeof panel.setLessonLoading === 'function' && currentLessonId) {
          panel.setLessonLoading(currentLessonId)
        }
        this.$set ? this.$set(this.progressLoading, planId, true) : (this.progressLoading[planId] = true)
        if (completed) this.launchConfetti()
        return
      }

      // Confirmed phase: apply fast-path value then do a single backend refresh
      if (typeof planProgress === 'number') {
        if (panel) panel.myProgress = Math.round((planProgress <= 1 ? planProgress * 100 : planProgress) * 100) / 100
        const idx = this.studyPlans.findIndex(sp => String(sp?.studyPlan?.id) === String(planId))
        if (idx >= 0) {
          this.studyPlans[idx].studyPlan.progress = Math.round((planProgress <= 1 ? planProgress * 100 : planProgress))
          if (completed) this.studyPlans[idx].studyPlan.lastStudiedAt = new Date().toISOString()
        }
      } else if (panel && typeof panel.fetchMyProgress === 'function') {
        panel.fetchMyProgress()
      }
      if (typeof lessonProgress === 'number' && panel && typeof panel.applyLessonProgress === 'function' && currentLessonId) {
        panel.applyLessonProgress(currentLessonId, lessonProgress)
      }
      // Refresh left list (also updates advanced progress) and lesson bars
      this.refreshPlanProgress(planId, { silent: true })
      if (typeof lessonProgress !== 'number' && panel && typeof panel.fetchLessonsProgress === 'function') {
        panel.fetchLessonsProgress()
      }
    },
    launchConfetti() {
      const end = Date.now() + 5 * 1000 // 5 seconds
      const colors = ['#EC0017', '#E2B43C', '#00FFF7']
      ;(function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors })
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors })
        if (Date.now() < end) requestAnimationFrame(frame)
      })()
    },
    onAiDialogChange(val) {
      if (!val) {
        this.fetchPlans()
        this.aiDirty = false
      }
    },
    // 统一的关闭入口：只有点右下角按钮才会触发
    attemptClose(which) {
      if (which === 'ai') {
        if (this.aiDirty) {
          const ok = window.confirm(this.$t('studyplan.dialogs.confirmCloseWithUnsaved'))
          if (!ok) return
        }
        this.aiDialog = false
        this.aiDirty = false
      } else if (which === 'edit') {
        if (this.editDirty) {
          const ok = window.confirm(this.$t('studyplan.dialogs.confirmCloseWithUnsaved'))
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
          alert(this.$t('studyplan.dialogs.noEditPermission'))
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

.mobile-plan-workspace {
  width: 100%;
  max-width: 100%;
  height: calc(100dvh - 82px - env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.mobile-plan-header {
  min-height: 54px;
  padding: calc(4px + env(safe-area-inset-top)) 4px 6px 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mobile-plan-eyebrow {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.58);
}

.mobile-plan-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  max-width: calc(100vw - 132px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-plan-header__actions {
  display: flex;
  align-items: center;
}

.mobile-plan-swipe-indicator {
  flex: 0 0 auto;
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2px 0 8px;
}

.mobile-plan-dot {
  width: 8px;
  height: 8px;
  border: 0;
  padding: 0;
  background: rgba(48, 78, 117, 0.28);
  cursor: pointer;
}

.mobile-plan-dot--active {
  width: 22px;
  background: #304e75;
}

.mobile-plan-window {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  touch-action: pan-y;
}

.mobile-plan-track {
  width: 300%;
  height: 100%;
  min-height: 0;
  display: flex;
  will-change: transform;
  transition: transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.mobile-plan-track--dragging {
  transition: none;
}

.mobile-plan-pane {
  flex: 0 0 calc(100% / 3);
  width: calc(100% / 3);
  max-width: calc(100% / 3);
  height: 100%;
  min-height: 0;
  overflow: hidden;
  transform: translateZ(0);
}

.mobile-plan-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f4eee1;
}

.mobile-plan-controls {
  flex: 0 0 auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-plan-scroll {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px;
}

.mobile-progress-sheet__content {
  height: min(84dvh, 720px);
  min-height: 0;
  background: #fbf8f2;
  overflow: hidden;
}

:global(body.phone-layout) .study-plan-form-dialog-card {
  height: 100dvh !important;
  max-height: 100dvh !important;
  border-radius: 0 !important;
}

:global(body.phone-layout) .study-plan-form-dialog-body {
  min-height: 0 !important;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

:global(body.phone-layout) .study-plan-form-dialog-actions {
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(48, 78, 117, 0.12);
}

:global(body.phone-layout) .study-plan-workspace {
  height: auto;
  padding: 0;
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

/* no skeleton styles; show progress only when value exists */
</style>
