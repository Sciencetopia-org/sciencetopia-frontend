<template>
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-1">组共享的计划</v-card-title>
    <v-card-text>
      <v-text-field v-model="q" :label="$t('common.search')" density="compact" hide-details clearable class="mb-2" @keyup.enter="fetchList" @click:clear="fetchList" />
      <div v-if="loading"><v-skeleton-loader type="list-item" v-for="n in 4" :key="n" /></div>
      <v-list v-else density="compact">
        <v-list-item v-for="p in items" :key="p.id" :active="String(p.id)===String(activePlanId)" @click="$emit('select', p.id)">
          <v-list-item-title>{{ p.title }}</v-list-item-title>
        </v-list-item>
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
        this.items = list.map(x => ({ id: x.id || x.planId, title: x.title || x.name }))
      } catch (_) {
        this.items = []
      } finally { this.loading = false }
    },
  },
}
</script>

<style scoped>
</style>

