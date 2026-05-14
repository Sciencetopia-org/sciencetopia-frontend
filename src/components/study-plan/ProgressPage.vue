<template>
  <v-card class="panel-card panel-card--cream progress-page" rounded="xl" elevation="2">
    <div class="progress-page__header d-flex align-center justify-space-between">
      <!-- <h2 class="text-h6">学习小组 · 速度与排行榜</h2> -->
      <v-btn size="small" variant="text" color="primary" @click="$emit('close')">返回学习计划</v-btn>
    </div>
    <div class="progress-page__body">
      <CohortStatsPanel v-if="planId" :planId="planId" @select-lesson="$emit('select-lesson', $event)" />
    </div>
  </v-card>
</template>

<script>
import CohortStatsPanel from '@/components/cohort/CohortStatsPanel.vue'

export default {
  name: 'ProgressPage',
  components: { CohortStatsPanel },
  emits: ['close', 'select-lesson'],
  props: {
    planId: { type: [String, Number], required: true },
  },
}
</script>

<style scoped>
.progress-page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 8px 12px 16px;
  display: flex;
  flex-direction: column;
}

.progress-page__header {
  flex: 0 0 auto;
  min-height: 36px;
  margin-bottom: 8px;
}

.progress-page__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
</style>

