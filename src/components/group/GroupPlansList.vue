<template>
  <v-card class="left-panel panel-card panel-card--beige" rounded="xl" elevation="2">
    <div class="plan-list-header d-flex align-center px-4 py-2">
      <span class="text-subtitle-1">组共享的计划</span>
    </div>
    <template v-if="$route.name !== 'studyGroupPage'">
      <v-btn class="ma-2" color="primary" variant="text"
        @click="$router.push({ name: 'studyGroupPage', params: { id: groupId } })" prepend-icon="mdi-arrow-left">
        返回学习小组
      </v-btn>
    </template>
    <v-divider />
    <v-card-text class="pa-0">
      <div class="d-flex align-center px-3 pb-2 gap-2">
        <v-text-field v-model="q" :label="$t('common.search')" density="compact" hide-details clearable
          class="flex-grow-1" append-inner-icon="mdi-magnify" @click:append-inner="fetchList" @keyup.enter="fetchList"
          @click:clear="fetchList" />
      </div>
      <div v-if="loading">
        <v-skeleton-loader type="list-item" v-for="n in 4" :key="n" />
      </div>
      <v-list v-else density="compact" class="plan-list">
        <v-list-item v-for="p in items" :key="p.studyPlanId" :active="String(p.studyPlanId) === String(activePlanId)"
          @click="$emit('select', p.studyPlanId)" class="group-plan-item plan-card">
          <div class="d-flex align-center justify-space-between">
            <v-list-item-title class="text-truncate mr-2">{{ p.planTitle }}</v-list-item-title>
            <div class="d-flex align-center">
              <v-chip v-if="p.enrollMode" size="x-small" label class="mr-2">{{ p.enrollMode }}</v-chip>
              <v-chip v-if="p.pinnedVersionId" size="x-small" label class="mr-2">v{{ p.pinnedVersionId }}</v-chip>
              <v-chip v-if="p.role" size="x-small" label color="primary">{{ p.role }}</v-chip>
            </div>
          </div>
          <v-progress-linear v-if="typeof p.avgProgress === 'number'" :model-value="p.avgProgress" height="6"
            color="primary" rounded class="mt-1" />
          <div v-if="p.memberCount" class="text-caption mt-1">{{ p.memberCount }} 人参与</div>
        </v-list-item>
        <div v-if="!items.length" class="text-caption text-medium-emphasis">暂无共享计划</div>
      </v-list>
    </v-card-text>
  </v-card>

</template>

<script>
import { apiClient } from '@/api'
export default {
  name: 'GroupPlansList',
  props: { groupId: { type: [String, Number], required: true }, activePlanId: { type: [String, Number], default: null } },
  emits: ['select', 'loaded'],
  data() {
    return { items: [], loading: false, q: '' }
  },
  watch: {
    groupId: { immediate: true, handler() { this.fetchList() } },
  },
  methods: {
    async fetchList() {
      this.loading = true
      try {
        const res = await apiClient.get(`/Groups/${this.groupId}/CohortPlans`)
        this.items = res.data

        // fetch roles for each plan
        await Promise.all(this.items.map(async (p) => {
          try {
            const roleRes = await apiClient.get(`/StudyPlans/${p.studyPlanId}/Permissions/Effective`)
            p.role = roleRes.data.role
          } catch (_) { p.role = null }
        }))
      } catch (_) {
        this.items = []
      } finally { this.loading = false; this.$emit('loaded') }
    },
  },
}
</script>

<style scoped></style>
