<template>
  <v-card class="study-plan-card">
    <v-row class="study-plan-header" align="center">
      <v-col cols="12" lg="5">
        <v-card-title class="study-plan-title">
          {{ isCurrentUser ? $t('usercenter.my') : $t('usercenter.their')
          }}{{ $t('wordbreaker') }}{{ $t('usercenter.studyplan') }}
        </v-card-title>
      </v-col>
      <v-col v-if="$slots.actions" cols="12" lg="7" class="study-plan-actions">
        <slot name="actions" />
      </v-col>
    </v-row>

    <template v-if="loading">
      <v-skeleton-loader type="list-item-two-line" class="mb-2" />
      <v-skeleton-loader type="list-item-two-line" class="mb-2" />
      <v-skeleton-loader type="list-item-two-line" />
    </template>

    <v-row v-else>
      <v-col
        v-for="sp in plans"
        :key="sp.studyPlan.id"
        cols="12"
      >
        <v-card class="study-plan-summary" @click="goToPlanDetail(sp.studyPlan.id)">
          <v-row align="center">
            <v-col cols="9" class="d-flex align-center">
              <v-card-title class="pr-2">{{ sp.studyPlan.title }}</v-card-title>
              <v-chip v-if="(sp.effectiveRole || sp.studyPlan?.effectiveRole)" size="x-small" label>
                {{ sp.effectiveRole || sp.studyPlan?.effectiveRole }}
              </v-chip>
            </v-col>
            <v-col cols="3" class="d-flex justify-end">
              <v-btn variant="plain" icon @click.stop="goToPlanDetail(sp.studyPlan.id)">
                <div class="go-to-icon"></div>
              </v-btn>
            </v-col>
          </v-row>
          <!-- Progress bars (match StudyPlanWorkspace left list) -->
          <div class="px-2 pb-2">
            <v-tooltip :text="$t('studyplan.progressTooltip', { percent: Math.round(sp.studyPlan.progress || 0) })" location="right" open-delay="300">
              <template #activator="{ props }">
                <template v-if="progressLoading[sp.studyPlan.id]">
                  <v-skeleton-loader type="text" class="mt-2" style="height:6px" />
                </template>
                <v-progress-linear
                  v-else-if="sp.studyPlan.progress !== undefined"
                  v-bind="props"
                  :model-value="sp.studyPlan.progress"
                  height="6"
                  color="primary"
                  rounded
                  class="mt-2"
                />
              </template>
            </v-tooltip>
            <v-tooltip :text="$t('studyplan.advancedProgressTooltip', { percent: Math.round(sp.studyPlan.advancedProgress || 0) })" location="right" open-delay="300">
              <template #activator="{ props }">
                <template v-if="progressLoading[sp.studyPlan.id]">
                  <v-skeleton-loader type="text" class="mt-1" style="height:6px" />
                </template>
                <v-progress-linear
                  v-else-if="sp.studyPlan.advancedProgress > 0"
                  v-bind="props"
                  :model-value="sp.studyPlan.advancedProgress"
                  height="6"
                  color="accent"
                  rounded
                  class="mt-1"
                />
              </template>
            </v-tooltip>
          </div>
        </v-card>
      </v-col>
    </v-row>
    <div v-if="!loading && studyPlanDataList.length === 0">
      <v-container>
        <v-card class="d-flex align-center justify-center">
          <v-card-title>
            {{ $t(emptyMessageKey) }}
          </v-card-title>
        </v-card>
      </v-container>
    </div>
  </v-card>
</template>

<script>
import { apiClient } from '@/api'

export default {
  data() {
    return {
      plans: [],
      progressLoading: {},
    }
  },
  props: {
    isCurrentUser: Boolean,
    studyPlanDataList: Array,
    progressStatus: {
      type: String,
      default: 'all',
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    emptyMessageKey() {
      if (this.isCurrentUser) {
        if (this.progressStatus === 'inProgress') return 'studyplan.noInProgressPlans'
        if (this.progressStatus === 'completed') return 'studyplan.noCompletedPlans'
        return 'studyplan.noPlansYet'
      }
      if (this.progressStatus === 'completed') return 'studyplan.noCompletedPlansTheir'
      if (this.progressStatus === 'inProgress') return 'studyplan.noprogress_their'
      return 'studyplan.noPlansTheir'
    },
  },
  watch: {
    studyPlanDataList: {
      immediate: true,
      handler(list) {
        const items = Array.isArray(list) ? list : []
        // Deep-ish clone to allow local progress state without mutating parent
        this.plans = items.map(item => ({
          effectiveRole: item.effectiveRole || item.studyPlan?.effectiveRole || null,
          studyPlan: {
            id: item.studyPlan?.id || item.id,
            title: item.studyPlan?.title || item.title,
            introduction: item.studyPlan?.introduction || (item.description ? { description: item.description } : null),
            progress: typeof item.studyPlan?.progress === 'number' ? item.studyPlan.progress : undefined,
            advancedProgress: typeof item.studyPlan?.advancedProgress === 'number' ? item.studyPlan.advancedProgress : 0,
          },
        }))
        // Kick off background progress fetch only for current user
        if (this.isCurrentUser) this.fetchAllProgress()
      },
    },
  },
  methods: {
    goToPlanDetail(planId) {
      this.$router.push({
        name: 'StudyPlanWorkspace',
        query: { planId },
      })
    },
    async fetchAllProgress() {
      const tasks = (this.plans || []).map(p => this.refreshPlanProgress(p?.studyPlan?.id))
      await Promise.allSettled(tasks)
    },
    async refreshPlanProgress(planId) {
      try {
        if (!planId) return
        this.$set ? this.$set(this.progressLoading, planId, true) : (this.progressLoading[planId] = true)
        const resp = await apiClient.get(`/studyPlans/${planId}/progress/me`)
        const raw = resp?.data?.planProgress
        const advRaw = resp?.data?.advancedTopicProgress
        const value = typeof raw === 'number' ? (raw <= 1 ? raw * 100 : raw) : undefined
        const advValue = typeof advRaw === 'number' ? (advRaw <= 1 ? advRaw * 100 : advRaw) : 0
        const idx = this.plans.findIndex(sp => String(sp?.studyPlan?.id) === String(planId))
        if (idx >= 0) {
          this.plans[idx].studyPlan.progress = typeof value === 'number' ? Math.round(value) : undefined
          this.plans[idx].studyPlan.advancedProgress = Math.round(advValue)
        }
      } catch (e) {
        // optional: compute locally (skipped for personal center lightweight list)
      } finally {
        this.$set ? this.$set(this.progressLoading, planId, false) : (this.progressLoading[planId] = false)
      }
    },
  },
}
</script>

<style scoped>
.study-plan-card {
  margin-top: 10px;
  padding-left: 40px;
  padding-right: 40px;
  padding-top: 20px;
  box-shadow: 0px 2px 10px 3px rgba(0, 0, 0, 0.1) !important;
  background-color: #f4eee1;
  height: 100%;
}

.study-plan-summary {
  padding: 10px 10px 0 10px;
  border: 2px solid #ccc;
}

.go-to-icon {
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 20px solid rgba(236, 0, 23, 0.8);
  transform: rotate(90deg);
}

.study-plan-title {
  font-size: 24px;
  /* font-weight: bold; */
}

.study-plan-header {
  margin-bottom: 8px;
}

.study-plan-actions {
  display: flex;
  justify-content: flex-end;
}

.study-plan-tab {
  color: #304e75;
  font-size: 18px;
}

@media (max-width: 1279px) {
  .study-plan-actions {
    justify-content: stretch;
  }
}
</style>
