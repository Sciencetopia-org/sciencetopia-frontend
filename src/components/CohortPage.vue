<template>
  <v-container class="cohort-page" fluid>
    <v-row>
      <v-col cols="12" md="8">
        <CohortStatsPanel :planId="planId" ref="stats" />
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="pa-3">
          <v-card-title>{{ $t('cohort.activity') }}</v-card-title>
          <v-card-text>
            <div v-if="events.length === 0" class="text-medium-emphasis">
              {{ $t('cohort.noactivity') }}
            </div>
            <v-list v-else density="compact">
              <v-list-item v-for="(e, i) in events" :key="i">
                <v-list-item-title>{{ e.type }}</v-list-item-title>
                <v-list-item-subtitle>{{ e.payload }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import CohortStatsPanel from './CohortStatsPanel.vue'
import studyHubSvc, { ensureStudyHubConnection, joinCohortRoom, leaveCohortRoom } from '@/services/study-hub'
import { apiClient } from '@/api'

export default {
  name: 'CohortPage',
  components: { CohortStatsPanel },
  props: {
    cohortId: { type: String, required: true },
  },
  data() {
    return {
      planId: null,
      events: [],
    }
  },
  async created() {
    // resolve planId for this cohort so stats panel can load
    try {
      const res = await apiClient.get(`/cohorts/${this.cohortId}`)
      this.planId = res?.data?.studyPlanId || res?.data?.planId || null
    } catch (e) {
      console.error('Failed to fetch cohort', e)
    }
  },
  async mounted() {
    await ensureStudyHubConnection()
    const hub = studyHubSvc.getStudyHub()
    if (hub) {
      hub.on('resourceCompleted', (msg) => {
        this.events.unshift({ type: 'resourceCompleted', payload: JSON.stringify(msg) })
        this.$refs.stats?.fetchSummary()
        this.$refs.stats?.fetchLeaderboard()
      })
      hub.on('progressUpdated', (msg) => {
        this.events.unshift({ type: 'progressUpdated', payload: JSON.stringify(msg?.summary || msg) })
        this.$refs.stats?.fetchSummary()
      })
    }
    await joinCohortRoom(this.cohortId)
  },
  beforeUnmount() {
    leaveCohortRoom(this.cohortId)
    const hub = studyHubSvc.getStudyHub()
    if (hub) {
      hub.off('resourceCompleted')
      hub.off('progressUpdated')
    }
  },
}
</script>

<style scoped>
.cohort-page { padding: 12px; }
</style>

