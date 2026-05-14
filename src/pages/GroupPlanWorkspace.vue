<template>
  <v-container fluid class="study-plan-workspace">
    <v-row>
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
    }
  },
  computed: {
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
  },
  methods: {
    onSelectPlan(pid, plan) {
      this.selectedPlanMeta = plan || null
      this.$router.push({ name: 'GroupPlanWorkspace', params: { groupId: this.groupId, planId: pid } })
    },
    onSelectLesson(id) { this.lessonId = id },
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

/* Make the row fill the container's height */
.study-plan-workspace>.v-row {
  height: 100%;
}
</style>

