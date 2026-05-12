<template>
  <div class="cohort-stats">
    <div class="stats-toolbar">
      <div>
        <div class="text-h6">{{ $t('cohort.statsTitle') }}</div>
        <div class="text-caption text-medium-emphasis">{{ activeCohortSubtitle }}</div>
      </div>
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
        :loading="loadingCohorts"
        :disabled="actionLocked || !cohortItems.length"
        @update:model-value="onCohortChange"
      />
    </div>

    <div v-if="loadingCohorts" class="mt-3">
      <v-skeleton-loader type="heading, list-item-two-line, list-item-two-line" />
    </div>
    <v-alert v-else-if="!cohorts.length" type="info" variant="tonal" class="mt-3">
      {{ $t('cohort.noPlanGroups') }}
    </v-alert>
    <template v-else>
      <v-alert v-if="hasNewVersion" type="warning" variant="tonal" class="mt-3">
        <div class="d-flex align-center">
          <span>{{ $t('cohort.hasNewVersion') }}</span>
          <v-spacer />
          <v-btn
            v-if="!isGroupScoped"
            size="small"
            color="primary"
            :loading="upgradeBusy"
            :disabled="actionLocked"
            @click="upgradeVersion"
          >{{ $t('cohort.upgrade') }}</v-btn>
          <v-btn
            v-else
            size="small"
            variant="text"
            color="primary"
            :disabled="actionLocked"
            @click="$router.push({ name: 'studyGroupPage', params: { groupId: activeCohort.studyGroupId } })"
          >
            {{ $t('cohort.gotoGroupManage') }}
          </v-btn>
        </div>
      </v-alert>

      <div v-if="loadingDashboard" class="mt-4">
        <v-skeleton-loader type="card, list-item-two-line, list-item, list-item, list-item" />
      </div>
      <template v-else>
        <div class="summary-grid mt-4">
          <div class="summary-tile">
            <span>{{ $t('cohort.avgProgress') }}</span>
            <strong>{{ formatPct(summary?.avgProgress) }}</strong>
          </div>
          <div class="summary-tile">
            <span>{{ $t('cohort.members') }}</span>
            <strong>{{ summary?.memberCount ?? 0 }}</strong>
          </div>
          <div class="summary-tile">
            <span>{{ $t('cohort.myProgress') }}</span>
            <strong>{{ formatPct(me?.progress) }}</strong>
          </div>
          <div class="summary-tile">
            <span>{{ $t('cohort.myRank') }}</span>
            <strong>{{ me?.rank ? `#${me.rank}` : '-' }}</strong>
          </div>
        </div>

        <v-card class="section-card mt-4" variant="outlined">
          <div class="section-header">
            <strong>{{ $t('cohort.myPosition') }}</strong>
            <v-chip size="x-small" label :color="me?.isEnrolled ? 'success' : 'grey'" variant="tonal">
              {{ me?.isEnrolled ? $t('cohort.joined') : $t('cohort.notJoined') }}
            </v-chip>
          </div>
          <div class="position-row">
            <div>
              <div class="text-body-2">{{ positionText }}</div>
              <div class="text-caption text-medium-emphasis mt-1">{{ nextStepText }}</div>
            </div>
            <v-spacer />
            <v-switch
              v-model="shareMetrics"
              inset
              hide-details
              density="compact"
              :disabled="actionLocked || !selectedCohortId"
              :label="$t('cohort.allowShareMetrics')"
            />
            <v-btn
              size="small"
              color="primary"
              class="ml-2"
              :loading="enrollBusy"
              :disabled="actionLocked || me?.isEnrolled"
              @click="enroll"
            >{{ $t('cohort.join') }}</v-btn>
            <v-tooltip v-if="isGroupScoped" :text="$t('cohort.leaveByGroup')" location="bottom">
              <template #activator="{ props }">
                <div v-bind="props">
                  <v-btn size="small" variant="outlined" color="red" class="ml-2" disabled>{{ $t('cohort.leave') }}</v-btn>
                </div>
              </template>
            </v-tooltip>
            <v-btn
              v-else
              size="small"
              variant="outlined"
              color="red"
              class="ml-2"
              :loading="enrollBusy"
              :disabled="actionLocked || !me?.isEnrolled"
              @click="unenroll"
            >{{ $t('cohort.leave') }}</v-btn>
          </div>
        </v-card>

        <div class="main-grid mt-4">
          <v-card class="section-card" variant="outlined">
            <div class="section-header">
              <strong>{{ $t('cohort.leaderboard') }}</strong>
              <v-select
                v-model="top"
                :items="[10, 20, 50]"
                :label="$t('cohort.top')"
                density="compact"
                hide-details
                class="top-select"
                :disabled="actionLocked"
                @update:model-value="fetchDashboard"
              />
            </div>
            <v-list v-if="leaderboard.length" density="compact">
              <v-list-item
              v-for="item in leaderboard"
                :key="item.userId"
                :class="{ 'is-me': item.isMe }"
              >
                <template #prepend>
                  <div class="rank-badge" :class="rankClass(item.rank)">
                    <v-icon v-if="item.rank <= 3" size="18" icon="mdi-trophy" />
                    <span>{{ rankLabel(item.rank) }}</span>
                  </div>
                  <v-avatar color="grey-lighten-2" size="32">
                    <v-img v-if="item.avatarUrl" :src="item.avatarUrl" alt="" />
                    <span v-else>{{ avatarInitial(item) }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ item.displayName || `#${item.rank}` }}</v-list-item-title>
                <template #append>
                  <v-chip size="x-small" label>{{ formatPct(item.progress) }}</v-chip>
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-else type="info" variant="tonal" density="comfortable">{{ $t('cohort.noLeaderboard') }}</v-alert>
          </v-card>

          <v-card class="section-card" variant="outlined">
            <div class="section-header">
              <strong>{{ $t('cohort.lessonDistribution') }}</strong>
            </div>
            <v-list v-if="lessons.length" density="compact">
              <v-list-item
                v-for="lesson in lessons"
                :key="lesson.lessonId"
                @click="$emit('select-lesson', lesson.lessonId)"
              >
                <v-list-item-title>{{ displayLessonTitle(lesson) }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ lesson.completedCount || 0 }} / {{ lesson.totalResources || 0 }}
                </v-list-item-subtitle>
                <template #append>
                  <v-progress-circular
                    :model-value="normalizePct(lesson.lessonAvgProgress)"
                    size="38"
                    width="4"
                    color="primary"
                  >
                    <span class="progress-number">{{ Math.round(normalizePct(lesson.lessonAvgProgress)) }}</span>
                  </v-progress-circular>
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-else type="info" variant="tonal" density="comfortable">{{ $t('cohort.noLessonStats') }}</v-alert>
          </v-card>
        </div>
      </template>
    </template>

    <v-snackbar v-model="errorSnack" timeout="2500">{{ errorText }}</v-snackbar>
  </div>
</template>

<script>
import { apiClient } from '@/api'

export default {
  name: 'CohortStatsPanel',
  props: {
    planId: { type: [String, Number], required: true },
  },
  emits: ['select-lesson'],
  data() {
    return {
      cohorts: [],
      selectedCohortId: null,
      dashboard: null,
      top: 20,
      loadingCohorts: false,
      loadingDashboard: false,
      enrollBusy: false,
      shareMetrics: true,
      upgradeBusy: false,
      errorSnack: false,
      errorText: '',
    }
  },
  computed: {
    cohortItems() {
      return this.cohorts.map((c) => ({
        id: c.id,
        title: c.title || c.planTitle || this.$t('cohort.untitledClass'),
      }))
    },
    activeCohort() {
      return this.cohorts.find(c => String(c.id) === String(this.selectedCohortId)) || this.dashboard?.cohort || null
    },
    activeCohortSubtitle() {
      if (!this.activeCohort) return this.$t('cohort.selectHint')
      const parts = []
      if (this.activeCohort.title) parts.push(this.activeCohort.title)
      if (this.activeCohort.pinnedVersionNumber) parts.push(`v${this.activeCohort.pinnedVersionNumber}`)
      return parts.join(' · ') || this.$t('cohort.untitledClass')
    },
    isGroupScoped() {
      return !!this.activeCohort?.studyGroupId
    },
    plan() {
      return this.$store.getters.planById(this.planId)
    },
    hasNewVersion() {
      const current = this.plan?.currentVersionNumber
      const pinned = this.activeCohort?.pinnedVersionNumber
      if (typeof current !== 'number' || typeof pinned !== 'number') return false
      return current !== pinned
    },
    summary() {
      return this.dashboard?.summary || null
    },
    me() {
      return this.dashboard?.me || null
    },
    leaderboard() {
      return Array.isArray(this.dashboard?.leaderboard) ? this.dashboard.leaderboard : []
    },
    lessons() {
      return Array.isArray(this.dashboard?.lessons) ? this.dashboard.lessons : []
    },
    actionLocked() {
      return this.loadingCohorts || this.loadingDashboard || this.enrollBusy || this.upgradeBusy
    },
    positionText() {
      if (!this.me?.isEnrolled) return this.$t('cohort.positionNotJoined')
      const avg = this.normalizePct(this.summary?.avgProgress)
      const mine = this.normalizePct(this.me?.progress)
      const diff = Math.round(mine - avg)
      if (diff >= 0) return this.$t('cohort.positionAhead', { diff })
      return this.$t('cohort.positionBehind', { diff: Math.abs(diff) })
    },
    nextStepText() {
      if (!this.lessons.length) return this.$t('cohort.nextStepDefault')
      const target = [...this.lessons].sort((a, b) => this.normalizePct(a.lessonAvgProgress) - this.normalizePct(b.lessonAvgProgress))[0]
      const title = this.displayLessonTitle(target)
      return title ? this.$t('cohort.nextStepFocus', { title }) : this.$t('cohort.nextStepDefault')
    },
  },
  watch: {
    planId: {
      immediate: true,
      async handler(val) {
        if (!val) return
        await this.fetchCohorts()
      },
    },
  },
  methods: {
    normalizePct(v) {
      const n = Number(v)
      if (!Number.isFinite(n)) return 0
      return n <= 1 ? n * 100 : n
    },
    formatPct(v) {
      return `${Math.round(this.normalizePct(v))}%`
    },
    rankLabel(rank) {
      const n = Number(rank)
      if (n === 1) return this.$t('cohort.rankFirst')
      if (n === 2) return this.$t('cohort.rankSecond')
      if (n === 3) return this.$t('cohort.rankThird')
      return `#${Number.isFinite(n) ? n : '-'}`
    },
    rankClass(rank) {
      const n = Number(rank)
      if (n === 1) return 'rank-gold'
      if (n === 2) return 'rank-silver'
      if (n === 3) return 'rank-bronze'
      return 'rank-normal'
    },
    avatarInitial(item) {
      const name = String(item?.displayName || item?.userId || '').trim()
      return name ? name.slice(0, 1).toUpperCase() : '?'
    },
    displayLessonTitle(lesson) {
      const title = String(lesson?.lessonTitle || lesson?.title || lesson?.name || '').trim()
      if (title) return title
      return this.$t('cohort.untitledLesson')
    },
    async fetchCohorts() {
      this.loadingCohorts = true
      this.dashboard = null
      try {
        const res = await apiClient.get(`/studyPlans/${this.planId}/cohorts`)
        this.cohorts = Array.isArray(res.data) ? res.data : []
        this.$store.commit('UPSERT_COHORTS', this.cohorts)
        this.selectedCohortId = this.cohorts[0]?.id || null
        if (this.selectedCohortId) await this.fetchDashboard()
      } catch (e) {
        this.toast(this.$t('operationfailed'))
      } finally {
        this.loadingCohorts = false
      }
    },
    async fetchDashboard() {
      if (!this.selectedCohortId) return
      this.loadingDashboard = true
      try {
        const res = await apiClient.get(`/cohorts/${this.selectedCohortId}/stats/dashboard`, {
          params: { top: this.top },
        })
        this.dashboard = res.data || null
        if (this.dashboard?.cohort) this.$store.commit('UPSERT_COHORT', this.dashboard.cohort)
        this.shareMetrics = this.dashboard?.me?.shareMetrics !== false
      } catch (e) {
        await this.fetchDashboardFallback()
      } finally {
        this.loadingDashboard = false
      }
    },
    async fetchDashboardFallback() {
      try {
        const [summaryRes, leaderboardRes, lessonsRes] = await Promise.all([
          apiClient.get(`/cohorts/${this.selectedCohortId}/stats/summary`),
          apiClient.get(`/cohorts/${this.selectedCohortId}/stats/leaderboard`, { params: { top: this.top } }),
          apiClient.get(`/cohorts/${this.selectedCohortId}/stats/lessons`),
        ])
        const leaderboard = Array.isArray(leaderboardRes.data)
          ? leaderboardRes.data.map((item, idx) => ({ ...item, rank: idx + 1, isMe: false }))
          : []
        this.dashboard = {
          cohort: this.activeCohort,
          summary: summaryRes.data || { avgProgress: 0, memberCount: 0 },
          me: { isEnrolled: false, progress: 0, rank: null, shareMetrics: true },
          leaderboard,
          lessons: Array.isArray(lessonsRes.data) ? lessonsRes.data : [],
        }
      } catch (e) {
        this.toast(this.$t('operationfailed'))
      }
    },
    onCohortChange() {
      this.fetchDashboard()
    },
    async enroll() {
      if (this.actionLocked || !this.selectedCohortId) return
      this.enrollBusy = true
      try {
        await apiClient.post(`/cohorts/${this.selectedCohortId}/enroll`, {
          shareMetrics: this.shareMetrics,
          role: 'member',
        })
        await this.fetchDashboard()
        this.toast(this.$t('cohort.joinSuccess'))
      } catch (e) {
        this.toast(this.$t('operationfailed'))
      } finally {
        this.enrollBusy = false
      }
    },
    async unenroll() {
      if (this.actionLocked || !this.selectedCohortId) return
      this.enrollBusy = true
      try {
        await apiClient.delete(`/cohorts/${this.selectedCohortId}/enroll`)
        await this.fetchDashboard()
        this.toast(this.$t('cohort.leaveSuccess'))
      } catch (e) {
        this.toast(this.$t('operationfailed'))
      } finally {
        this.enrollBusy = false
      }
    },
    async upgradeVersion() {
      const currentVersionNumber = this.plan?.currentVersionNumber
      if (this.actionLocked || !this.activeCohort || typeof currentVersionNumber !== 'number') return
      this.upgradeBusy = true
      try {
        try {
          await apiClient.post(`/Cohorts/${this.activeCohort.id}/UpgradeVersion`)
        } catch (_) {
          await apiClient.post(`/cohorts/${this.activeCohort.id}/upgradeVersion`)
        }
        this.$store.commit('UPSERT_COHORT', { id: this.activeCohort.id, pinnedVersionNumber: currentVersionNumber })
        await this.fetchDashboard()
        this.toast(this.$t('cohort.upgradeSuccess'))
      } catch (e) {
        this.toast(this.$t('cohort.upgradeFailed'))
      } finally {
        this.upgradeBusy = false
      }
    },
    toast(text) {
      this.errorText = text
      this.errorSnack = true
    },
  },
}
</script>

<style scoped>
.cohort-stats {
  background-color: transparent;
}
.stats-toolbar,
.section-header,
.position-row {
  display: flex;
  align-items: center;
}
.cohort-select {
  max-width: 280px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 10px;
}
.summary-tile {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.48);
}
.summary-tile span {
  display: block;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.62);
}
.summary-tile strong {
  display: block;
  margin-top: 4px;
  font-size: 22px;
  font-weight: 650;
}
.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}
.section-card {
  padding: 12px;
  border-radius: 8px;
}
.top-select {
  max-width: 120px;
}
.is-me {
  background: rgba(25, 118, 210, 0.08);
  border-radius: 8px;
}
.rank-badge {
  width: 58px;
  min-width: 58px;
  height: 28px;
  margin-right: 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 700;
}
.rank-gold {
  color: #7a4a00;
  background: linear-gradient(135deg, #fff3bf, #f6c343);
  box-shadow: 0 0 0 1px rgba(181, 125, 0, 0.18);
}
.rank-silver {
  color: #46515f;
  background: linear-gradient(135deg, #f4f6f8, #b8c2cc);
  box-shadow: 0 0 0 1px rgba(98, 111, 127, 0.18);
}
.rank-bronze {
  color: #6b3517;
  background: linear-gradient(135deg, #f6d0b2, #c77b3a);
  box-shadow: 0 0 0 1px rgba(139, 79, 34, 0.18);
}
.rank-normal {
  color: rgba(0, 0, 0, 0.68);
  background: rgba(0, 0, 0, 0.06);
}
.progress-number {
  font-size: 11px;
}
@media (max-width: 900px) {
  .summary-grid,
  .main-grid {
    grid-template-columns: 1fr;
  }
  .stats-toolbar,
  .position-row {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }
  .cohort-select {
    max-width: none;
  }
}
</style>
