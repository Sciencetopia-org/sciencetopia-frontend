<template>
  <v-card class="panel-card panel-card--cream progress-page" rounded="xl" elevation="2">
    <div class="d-flex align-center justify-space-between mb-2">
      <h2 class="text-h6">学习小组 · 速度与排行榜</h2>
      <v-btn size="small" variant="text" color="primary" @click="$emit('close')">返回学习计划</v-btn>
    </div>
    <CohortStatsPanel v-if="planId" :planId="planId" />
  </v-card>
</template>

<script>
import CohortStatsPanel from '@/components/CohortStatsPanel.vue'

export default {
  name: 'ProgressPage',
  components: { CohortStatsPanel },
  props: {
    planId: { type: [String, Number], required: true },
  },
}
</script>

<style scoped>
.progress-page {
  height: 100%;
  overflow-y: auto;
  padding: 8px 12px 16px;
}
</style>
