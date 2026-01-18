<template>
  <v-card class="cohort-stats">
    <v-card-title class="d-flex align-center">
      {{ $t('cohort.statsTitle') }}
      <v-spacer />
      <v-select
        v-model="selectedCohortId"
        :items="cohortItems"
        item-title="title"
        item-value="id"
        :label="$t('cohort.select')"
        density="compact"
        variant="outlined"
        class="cohort-select"
        @update:model-value="onCohortChange"
      />
    </v-card-title>
    <v-card-text>
      <!-- Version prompt -->
      <div v-if="plan && activeCohort && hasNewVersion" class="mb-2">
        <v-alert type="warning" variant="tonal" class="mb-2">
          <div class="d-flex align-center">
            <span>{{ $t('cohort.hasNewVersion') }}</span>
            <v-spacer />
            <v-btn
              v-if="!isGroupScoped"
              size="small"
              color="primary"
              :loading="upgradeBusy"
              @click="upgradeVersion"
            >{{ $t('cohort.upgrade') }}</v-btn>
            <v-btn v-else size="small" variant="text" color="primary" @click="$router.push({ name: 'studyGroupPage', params: { groupId: activeCohort.studyGroupId } })">
              {{ $t('cohort.gotoGroupManage') }}
            </v-btn>
          </div>
        </v-alert>
      </div>
      <div v-if="loadingCohorts">
        <v-skeleton-loader type="list-item-two-line" />
      </div>
      <div v-else-if="!cohorts.length">
        <em>{{ $t('cohort.noPlanGroups') }}</em>
      </div>
      <template v-else>
        <div class="d-flex align-center mb-2" v-if="loadingSummary">
          <v-skeleton-loader type="text" class="mr-2" />
          <v-skeleton-loader type="text" />
        </div>
        <div v-else-if="summary">
          <v-chip class="mr-2" color="primary" label>
            {{ $t('cohort.avgProgress') }}{{ $t(':') }}{{ (summary?.avgProgress ?? summary?.planProgress ?? 0) }}%
          </v-chip>
          <v-chip label>{{ $t('cohort.members') }}{{ $t(':') }}{{ summary?.memberCount ?? 0 }}</v-chip>
        </div>

        <div class="mt-2 d-flex align-center">
          <v-switch v-model="shareMetrics" inset hide-details density="compact" :label="$t('cohort.allowShareMetrics')" />
          <v-spacer />
          <v-btn size="small" color="primary" class="mr-2" :loading="enrollBusy" @click="enroll">{{ $t('cohort.join') }}</v-btn>
          <v-tooltip v-if="isGroupScoped" :text="$t('cohort.leaveByGroup')" location="bottom">
            <template #activator="{ props }">
              <div v-bind="props">
                <v-btn size="small" variant="outlined" color="red" :disabled="true">{{ $t('cohort.leave') }}</v-btn>
              </div>
            </template>
          </v-tooltip>
          <v-btn v-else size="small" variant="outlined" color="red" :loading="enrollBusy" @click="unenroll">{{ $t('cohort.leave') }}</v-btn>
        </div>

        <div class="mt-4">
          <div class="d-flex align-center mb-2">
            <strong>{{ $t('cohort.leaderboard') }}</strong>
            <v-spacer />
            <v-select
              v-model="top"
              :items="[10, 20, 50]"
              :label="$t('cohort.top')"
              density="compact"
              style="max-width: 120px"
              @update:model-value="fetchLeaderboard"
            />
          </div>
          <div v-if="loadingLeaderboard">
            <v-skeleton-loader type="list-item" v-for="n in 5" :key="n" />
          </div>
          <v-list v-else>
            <v-list-item v-for="(item, idx) in leaderboard" :key="item.userId">
              <template #prepend>
                <v-avatar color="grey-lighten-2" size="28">{{ idx + 1 }}</v-avatar>
              </template>
              <v-list-item-title>{{ item.displayName }}</v-list-item-title>
              <template #append>
                <v-chip size="x-small" label>{{ item.progress }}%</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </template>
    </v-card-text>
    <v-snackbar v-model="errorSnack" timeout="2500">{{ errorText }}</v-snackbar>
  </v-card>
</template>

<script>
import { apiClient } from '@/api'
import { fetchEffectivePermissions } from '@/services/effective-permissions'

export default {
  name: 'CohortStatsPanel',
  props: {
    planId: { type: [String, Number], required: true },
  },
  data() {
    return {
      cohorts: [],
      selectedCohortId: null,
      summary: null,
      leaderboard: [],
      top: 20,
      loadingCohorts: false,
      loadingSummary: false,
      loadingLeaderboard: false,
      enrollBusy: false,
      shareMetrics: true,
      upgradeBusy: false,
      errorSnack: false,
      errorText: '',
      perms: null,
    }
  },
  computed: {
    cohortItems() {
      return this.cohorts.map((c) => ({ id: c.id, title: c.title || c.id }))
    },
    plan() {
      return this.$store.getters.planById(this.planId)
    },
    enrollment() {
      return this.$store.getters.enrollmentOfPlan(this.planId)
    },
    activeCohort() {
      const id = this.selectedCohortId || this.enrollment?.activeCohortId
      return id ? this.$store.getters.cohortById(id) || this.cohorts.find(c => String(c.id) === String(id)) : null
    },
    isGroupScoped() {
      return !!this.activeCohort?.studyGroupId
    },
    hasNewVersion() {
      const current = this.plan?.currentVersionNumber
      const pinned = this.activeCohort?.pinnedVersionNumber
      if (typeof current !== 'number' || typeof pinned !== 'number') return false
      return current !== pinned
    },
  },
  watch: {
    planId: {
      immediate: true,
      async handler(val) {
        if (!val) return
        await Promise.all([this.fetchCohorts(), this.loadPerms()])
      },
    },
    selectedCohortId() {
      this.loadPerms()
    },
  },
  methods: {
    async loadPerms() {
      try {
        this.perms = await fetchEffectivePermissions({ planId: this.planId, cohortId: this.selectedCohortId || this.enrollment?.activeCohortId })
      } catch (_) {
        this.perms = null
      }
    },
    async fetchCohorts() {
      this.loadingCohorts = true
      try {
        const res = await apiClient.get(`/studyPlans/${this.planId}/cohorts`)
        this.cohorts = Array.isArray(res.data) ? res.data : []
        this.selectedCohortId = this.cohorts[0]?.id || null
        if (this.selectedCohortId) {
          await Promise.all([this.fetchSummary(), this.fetchLeaderboard()])
        }
      } catch (e) {
        this.toastError(this.$t('operationfailed'))
      } finally {
        this.loadingCohorts = false
      }
    },
    onCohortChange() {
      if (!this.selectedCohortId) return
      this.fetchSummary()
      this.fetchLeaderboard()
    },
    async fetchSummary() {
      if (!this.selectedCohortId) return
      this.loadingSummary = true
      try {
        const res = await apiClient.get(`/cohorts/${this.selectedCohortId}/stats/summary`)
        this.summary = res.data
      } catch (e) {
        this.toastError(this.$t('operationfailed'))
      } finally {
        this.loadingSummary = false
      }
    },
    async fetchLeaderboard() {
      if (!this.selectedCohortId) return
      this.loadingLeaderboard = true
      try {
        const res = await apiClient.get(`/cohorts/${this.selectedCohortId}/stats/leaderboard`, {
          params: { top: this.top },
        })
        this.leaderboard = Array.isArray(res.data) ? res.data : []
      } catch (e) {
        this.toastError(this.$t('operationfailed'))
      } finally {
        this.loadingLeaderboard = false
      }
    },
    async enroll() {
      if (!this.selectedCohortId) return
      this.enrollBusy = true
      try {
        await apiClient.post(`/cohorts/${this.selectedCohortId}/enroll`, {
          shareMetrics: this.shareMetrics,
          role: 'member',
        })
        await Promise.all([this.fetchSummary(), this.fetchLeaderboard()])
        this.toastError(this.$t('cohort.joinSuccess'), false)
      } catch (e) {
        this.toastError(this.$t('operationfailed'))
      } finally {
        this.enrollBusy = false
      }
    },
    async unenroll() {
      if (!this.selectedCohortId) return
      this.enrollBusy = true
      try {
        await apiClient.delete(`/cohorts/${this.selectedCohortId}/enroll`)
        await Promise.all([this.fetchSummary(), this.fetchLeaderboard()])
        this.toastError(this.$t('cohort.leaveSuccess'), false)
      } catch (e) {
        this.toastError(this.$t('operationfailed'))
      } finally {
        this.enrollBusy = false
      }
    },
    async upgradeVersion() {
      const currentVersionNumber = this.plan?.currentVersionNumber
      if (!this.activeCohort || typeof currentVersionNumber !== 'number') return
      this.upgradeBusy = true
      try {
        try {
          await apiClient.post(`/Cohorts/${this.activeCohort.id}/UpgradeVersion`)
        } catch (_) {
          await apiClient.post(`/cohorts/${this.activeCohort.id}/upgradeVersion`)
        }
        this.$store.commit('UPSERT_COHORT', { id: this.activeCohort.id, pinnedVersionNumber: currentVersionNumber })
        this.toastError(this.$t('cohort.upgradeSuccess'), false)
        await this.fetchSummary()
      } catch (e) {
        this.toastError(this.$t('cohort.upgradeFailed'))
      } finally {
        this.upgradeBusy = false
      }
    },
    toastError(text, isError = true) {
      this.errorText = text
      this.errorSnack = true
    },
  },
}
</script>

<style scoped>
.cohort-stats {
  margin-top: 12px;
  background-color: transparent !important;
}
.cohort-select {
  max-width: 260px;
}
</style>
