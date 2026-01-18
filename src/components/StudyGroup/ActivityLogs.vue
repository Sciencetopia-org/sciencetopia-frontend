<template>
  <v-card class="activity-logs">
  <v-card-title>{{ $t('studygroup.activitylog') }}</v-card-title>
    <v-card-text>
      <div v-if="loading">
        <LoadingSpinner />
      </div>
      <v-list v-else>
        <v-list-item v-for="log in logs" :key="log.id">
          <v-list-item-content>
            <v-list-item-title>{{ log.message }}</v-list-item-title>
            <v-list-item-subtitle>{{ log.date }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
import { apiClient } from '@/api'

export default {
  components: { LoadingSpinner: require('@/components/ui/LoadingSpinner.vue').default },
  props: {
    groupId: String,
  },
  data() {
    return {
      logs: [],
      loading: true,
    }
  },
  async mounted() {
    try {
      const response = await apiClient.get(
        `/StudyGroup/GetActivityLogs/${this.groupId}`
      )
      this.logs = response.data
    } finally {
      this.loading = false
    }
  },
}
</script>

<style scoped>
.activity-logs {
  max-width: 1200px;
  margin: auto;
  background-color: unset !important;
}
</style>

