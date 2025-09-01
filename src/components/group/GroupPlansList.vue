<template>
  <v-card class="left-panel panel-card panel-card--beige" rounded="xl" elevation="2">
    <div class="plan-list-header d-flex align-center px-4 py-2">
      <span class="text-subtitle-1">组共享的计划</span>
    </div>
    <v-divider />
    <v-card-text class="pa-0">
      <div class="d-flex align-center px-3 pb-2 gap-2">
        <v-text-field
          v-model="q"
          :label="$t('common.search')"
          density="compact"
          hide-details
          clearable
          class="flex-grow-1"
          append-inner-icon="mdi-magnify"
          @click:append-inner="fetchList"
          @keyup.enter="fetchList"
          @click:clear="fetchList"
        />
      </div>
      <div v-if="loading">
        <v-skeleton-loader type="list-item" v-for="n in 4" :key="n" />
      </div>
      <v-list v-else density="compact" class="plan-list">
        <v-list-item
          v-for="p in items"
          :key="p.id"
          :active="String(p.id)===String(activePlanId)"
          @click="$emit('select', p.id)"
          class="group-plan-item plan-card"
        >
          <div class="d-flex align-center justify-space-between">
            <v-list-item-title class="text-truncate mr-2">{{ p.title }}</v-list-item-title>
            <div class="d-flex align-center">
              <v-chip v-if="p.shareMode" size="x-small" label class="mr-2">{{ p.shareMode }}</v-chip>
              <v-chip v-if="p.role" size="x-small" label color="primary">{{ p.role }}</v-chip>
            </div>
          </div>
          <v-progress-linear
            v-if="typeof p.avgProgress === 'number'"
            :model-value="p.avgProgress"
            height="6"
            color="primary"
            rounded
            class="mt-1"
          />
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
  emits: ['select'],
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
        const res = await apiClient.get(`/groups/${this.groupId}/plans`, { params: { q: this.q } })
        const list = Array.isArray(res?.data) ? res.data : res?.data?.items || []
        this.items = list.map(x => ({
          id: x.id || x.planId,
          title: x.title || x.name,
          role: x.role || x.planRole || null,
          shareMode: x.shareMode || x.permission || null,
          avgProgress: typeof x.avgProgress === 'number' ? x.avgProgress : (typeof x.progress === 'number' ? x.progress : undefined),
          memberCount: x.memberCount || x.members || undefined,
          cohortId: x.cohortId || x.activeCohortId || null,
        }))
      } catch (_) {
        this.items = []
      } finally { this.loading = false }
    },
  },
}
</script>

<style scoped>
</style>
