<template>
  <v-container fluid class="study-plan-workspace" :class="{ 'study-plan-workspace--mobile': isPhone }">
    <div v-if="isPhone" class="mobile-group-plan-workspace">
      <div class="mobile-group-plan-header">
        <div>
          <div class="mobile-group-plan-eyebrow">{{ $t('groupPlan.sharedPlans') }}</div>
          <div class="mobile-group-plan-title">{{ mobileHeaderTitle }}</div>
        </div>
        <v-btn icon="mdi-account-group-outline" variant="text" size="small" @click="openGroupPage" />
      </div>

      <div class="mobile-group-plan-swipe-indicator" :aria-label="mobileTabLabel">
        <button
          v-for="item in mobileSwipeItems"
          :key="item.value"
          type="button"
          class="mobile-group-plan-dot"
          :class="{ 'mobile-group-plan-dot--active': mobileTab === item.value }"
          :aria-label="item.label"
          @click="goToMobileTab(item.value)"
        />
      </div>

      <div
        class="mobile-group-plan-window"
        @touchstart.passive="onMobileSwipeStart"
        @touchmove.passive="onMobileSwipeMove"
        @touchend="onMobileSwipeEnd"
        @touchcancel="onMobileSwipeCancel"
      >
        <div
          class="mobile-group-plan-track"
          :class="{ 'mobile-group-plan-track--dragging': mobileSwipeDragging }"
          :style="mobileTrackStyle"
        >
          <section class="mobile-group-plan-pane">
            <v-card class="mobile-group-plan-card panel-card panel-card--beige" rounded="lg" elevation="1">
              <div class="mobile-group-plan-scroll">
                <template v-if="!leftLoaded">
                  <v-skeleton-loader type="list-item" v-for="n in 4" :key="`mobile-list-${n}`" />
                </template>
                <GroupPlansList
                  v-show="leftLoaded"
                  :groupId="groupId"
                  :activePlanId="planId"
                  :bare="true"
                  @select="onSelectPlan"
                  @loaded="onLeftLoaded"
                />
              </div>
            </v-card>
          </section>

          <section class="mobile-group-plan-pane">
            <div class="mobile-group-plan-scroll">
              <template v-if="!centerLoaded">
                <v-card class="panel-card panel-card--cream pa-4" rounded="lg" elevation="1">
                  <v-skeleton-loader type="heading, text, list-item, list-item, list-item" />
                </v-card>
              </template>
              <PlanDetailPanel
                v-show="centerLoaded"
                :planId="planId"
                :scope="{ type: 'group', groupId, shareMode }"
                :allowEditControls="false"
                headerMode="groupShared"
                :groupPlanActionState="groupPlanActionState"
                @select-lesson="onSelectLesson"
                @loaded="onCenterLoaded"
                @enroll-cohort="enrollSelectedCohort"
                @open-my-plan="openInMyPlans"
              />
            </div>
          </section>

          <section class="mobile-group-plan-pane">
            <div class="mobile-group-plan-scroll">
              <LessonDetailPanel
                v-if="lessonId"
                :planId="planId"
                :lessonId="lessonId"
                :scope="{ type: 'group', groupId, shareMode }"
                :canInteract="canInteractInGroup"
              />
              <v-card v-else class="panel-card panel-card--beige pa-4" rounded="lg" elevation="1">
                <div class="placeholder">{{ $t('lessonDetail.selectLesson') }}</div>
              </v-card>
            </div>
          </section>
        </div>
      </div>
    </div>

    <v-row v-else>
      <!-- Left: Plans list -->
      <v-col :cols="3" class="pa-0">
        <template v-if="!leftLoaded">
          <v-card class="left-panel panel-card panel-card--beige" rounded="xl" elevation="2">
            <v-skeleton-loader type="heading" class="px-4 py-2" />
            <v-divider />
            <div class="pa-2">
              <v-skeleton-loader type="list-item" v-for="n in 4" :key="'l-'+n" />
            </div>
          </v-card>
        </template>
        <GroupPlansList v-show="leftLoaded" :groupId="groupId" :activePlanId="planId" @select="onSelectPlan" @loaded="onLeftLoaded" />
      </v-col>

      <!-- Middle: Plan details -->
      <v-col :cols="5" class="center-panel">
        <template v-if="!centerLoaded">
          <v-card class="panel-card panel-card--cream" rounded="xl" elevation="2">
            <div class="pa-4">
              <v-skeleton-loader type="heading, text, list-item, list-item, list-item" />
            </div>
          </v-card>
        </template>
        <PlanDetailPanel
          v-show="centerLoaded"
          :planId="planId"
          :scope="{ type: 'group', groupId, shareMode }"
          :allowEditControls="false"
          headerMode="groupShared"
          :groupPlanActionState="groupPlanActionState"
          @select-lesson="onSelectLesson"
          @loaded="onCenterLoaded"
          @enroll-cohort="enrollSelectedCohort"
          @open-my-plan="openInMyPlans"
        />
      </v-col>

      <!-- Right: Lesson details -->
      <v-col :cols="4" class="right-panel">
        <LessonDetailPanel :planId="planId" :lessonId="lessonId" :scope="{ type: 'group', groupId, shareMode }" :canInteract="canInteractInGroup" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import GroupPlansList from '@/components/StudyGroup/GroupPlansList.vue'
import PlanDetailPanel from '@/components/study-plan/PlanDetailPanel.vue'
import LessonDetailPanel from '@/components/study-plan/LessonDetailPanel.vue'
import { roleAllowsComment } from '@/services/studyplan-permissions'
import { apiClient } from '@/api'
import { isPhoneDevice, phoneDeviceRevision } from '@/utils/device'

export default {
  name: 'GroupPlanWorkspace',
  components: { GroupPlansList, PlanDetailPanel, LessonDetailPanel },
  props: { groupId: { type: [String, Number], required: true }, planId: { type: [String, Number], required: true } },
  data() {
    return {
      lessonId: this.$route.query.lessonId || null,
      shareMode: 'Editable',
      planRole: null,
      leftLoaded: false,
      centerLoaded: false,
      groupPlans: [],
      selectedPlanMeta: null,
      enrollment: null,
      enrollmentLoading: false,
      enrollBusy: false,
      mobileTab: 'plans',
      mobileSwipeStartX: 0,
      mobileSwipeStartY: 0,
      mobileSwipeDeltaX: 0,
      mobileSwipeDragging: false,
    }
  },
  computed: {
    isPhone() {
      phoneDeviceRevision.value
      return isPhoneDevice()
    },
    canInteractInGroup() { return this.shareMode === 'Editable' && roleAllowsComment(this.planRole) },
    activePlanMeta() {
      if (this.selectedPlanMeta && String(this.selectedPlanMeta.studyPlanId || this.selectedPlanMeta.studyPlanStableId) === String(this.planId)) {
        return this.selectedPlanMeta
      }
      return this.groupPlans.find((plan) => {
        const planVersionId = plan?.studyPlanId
        const stableId = plan?.studyPlanStableId
        return String(planVersionId) === String(this.planId) || String(stableId) === String(this.planId)
      }) || null
    },
    activePlanCohorts() {
      return Array.isArray(this.activePlanMeta?.cohorts) ? this.activePlanMeta.cohorts : []
    },
    selectedJoinableCohort() {
      return this.activePlanCohorts.find(c => c?.id) || null
    },
    isEnrolledInPlan() {
      return !!(this.enrollment?.activeCohortId || this.enrollment?.ActiveCohortId)
    },
    groupPlanActionState() {
      return {
        isEnrolled: this.isEnrolledInPlan,
        loading: this.enrollmentLoading || this.enrollBusy,
        disabled: !this.selectedJoinableCohort?.id,
      }
    },
    mobileSwipeItems() {
      return [
        { value: 'plans', label: this.$t('groupPlan.sharedPlans') },
        { value: 'details', label: this.$t('overview') || 'Overview' },
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
    mobileHeaderTitle() {
      return this.activePlanMeta?.planTitle || this.$t('groupPlan.sharedPlans')
    },
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
    onSelectPlan(pid, plan) {
      this.selectedPlanMeta = plan || null
      this.$router.push({ name: 'GroupPlanWorkspace', params: { groupId: this.groupId, planId: pid } })
      if (this.isPhone) this.goToMobileTab('details')
    },
    onSelectLesson(id) {
      this.lessonId = id
      if (this.isPhone) this.goToMobileTab('resource')
    },
    onLeftLoaded(items) {
      this.groupPlans = Array.isArray(items) ? items : []
      this.selectedPlanMeta = this.activePlanMeta
      this.leftLoaded = true
    },
    onCenterLoaded() { this.centerLoaded = true },
    async fetchEnrollment() {
      if (!this.planId) return
      this.enrollmentLoading = true
      try {
        const res = await apiClient.get(`/StudyPlans/${this.planId}/Enrollment/Me`)
        this.enrollment = res?.data || null
      } catch (_) {
        this.enrollment = null
      } finally {
        this.enrollmentLoading = false
      }
    },
    async enrollSelectedCohort() {
      const cohortId = this.selectedJoinableCohort?.id
      if (!cohortId || this.enrollBusy) return
      this.enrollBusy = true
      try {
        await apiClient.post(`/cohorts/${cohortId}/enroll`, { role: 'member' })
        await this.fetchEnrollment()
        this.openInMyPlans()
      } finally {
        this.enrollBusy = false
      }
    },
    openInMyPlans() {
      const userId = this.$store.state.currentUserID || this.$store.state.userInfo?.id
      if (!userId) return
      this.$router.push({
        name: 'StudyPlanWorkspace',
        params: { userId },
        query: { planId: this.planId },
      })
    },
    openGroupPage() {
      this.$router.push({ name: 'studyGroupPage', params: { groupId: this.groupId } })
    },
  },
  watch: {
    groupId() { this.leftLoaded = false },
    planId: {
      immediate: true,
      handler() {
        this.centerLoaded = false
        this.selectedPlanMeta = this.activePlanMeta
        this.fetchEnrollment()
      },
    },
  },
}
</script>

<style scoped>
.study-plan-workspace {
  height: calc(100vh - 64px);
  overflow: hidden;
}

.study-plan-workspace--mobile {
  height: auto;
  padding: 0;
}

.mobile-group-plan-workspace {
  width: 100%;
  max-width: 100%;
  height: calc(100dvh - 82px - env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.mobile-group-plan-header {
  min-height: 54px;
  padding: calc(8px + env(safe-area-inset-top)) 4px 8px 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mobile-group-plan-eyebrow {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.58);
  line-height: 1.2;
}

.mobile-group-plan-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  max-width: calc(100vw - 116px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-group-plan-swipe-indicator {
  flex: 0 0 auto;
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2px 0 8px;
}

.mobile-group-plan-dot {
  width: 8px;
  height: 8px;
  border: 0;
  padding: 0;
  background: rgba(48, 78, 117, 0.28);
  cursor: pointer;
}

.mobile-group-plan-dot--active {
  width: 22px;
  background: #304e75;
}

.mobile-group-plan-window {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  touch-action: pan-y;
}

.mobile-group-plan-track {
  width: 300%;
  height: 100%;
  min-height: 0;
  display: flex;
  will-change: transform;
  transition: transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.mobile-group-plan-track--dragging {
  transition: none;
}

.mobile-group-plan-pane {
  flex: 0 0 calc(100% / 3);
  width: calc(100% / 3);
  max-width: calc(100% / 3);
  height: 100%;
  min-height: 0;
  overflow: hidden;
  transform: translateZ(0);
}

.mobile-group-plan-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-group-plan-scroll {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px;
}

/* Make the row fill the container's height */
.study-plan-workspace>.v-row {
  height: 100%;
}
</style>

