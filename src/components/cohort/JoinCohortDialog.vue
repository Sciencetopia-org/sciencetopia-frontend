<template>
  <v-dialog v-model="inner" max-width="720">
    <v-card rounded="xl">
      <v-card-title>{{ $t('cohortJoin.title') }}</v-card-title>
      <v-card-text>
        <div v-if="loading"><v-skeleton-loader type="list-item" v-for="n in 4" :key="n" /></div>
        <div v-else>
          <div class="mb-4">
            <h4 class="text-subtitle-1 mb-2">{{ $t('cohortJoin.groupScoped') }}</h4>
            <div v-if="groupScoped.length === 0"><em>{{ $t('cohortJoin.none') }}</em></div>
            <v-list v-else density="compact">
              <v-list-item v-for="c in groupScoped" :key="c.id">
                <v-list-item-title>{{ c.title || c.id }}</v-list-item-title>
                <template #append>
                  <v-btn size="small" :disabled="hasActive" @click="onJoin(c)">{{ hasActive ? $t('cohortJoin.switch') : $t('cohortJoin.join') }}</v-btn>
                </template>
              </v-list-item>
            </v-list>
          </div>
          <div class="mb-4">
            <h4 class="text-subtitle-1 mb-2">{{ $t('cohortJoin.public') }}</h4>
            <div v-if="publicList.length === 0"><em>{{ $t('cohortJoin.none') }}</em></div>
            <v-list v-else density="compact">
              <v-list-item v-for="c in publicList" :key="c.id">
                <v-list-item-title>{{ c.title || c.id }}</v-list-item-title>
                <template #append>
                  <v-btn size="small" :disabled="hasActive" @click="onJoin(c)">{{ hasActive ? $t('cohortJoin.switch') : $t('cohortJoin.join') }}</v-btn>
                </template>
              </v-list-item>
            </v-list>
            <div class="d-flex justify-center mt-1">
              <v-btn size="small" variant="text" :disabled="!hasMore || loadingMore" :loading="loadingMore" @click="loadMore">{{ $t('cohortJoin.showMore') }}</v-btn>
            </div>
          </div>
          <div>
            <h4 class="text-subtitle-1 mb-2">{{ $t('cohortJoin.startSolo') }}</h4>
            <v-alert type="info" variant="tonal" density="compact">{{ $t('cohortJoin.soloDesc') }}</v-alert>
            <div class="d-flex justify-end mt-2">
              <v-btn size="small" color="primary" :disabled="hasActive" @click="onStartSolo">{{ hasActive ? $t('cohortJoin.switch') : $t('cohortJoin.start') }}</v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="close">{{ $t('close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { apiClient } from '@/api'
export default {
  name: 'JoinCohortDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    planId: { type: [String, Number], required: true },
    activeCohortId: { type: [String, Number, null], default: null },
  },
  data() {
    return {
      inner: this.modelValue,
      loading: false,
      loadingMore: false,
      page: 1,
      pageSize: 10,
      groupScoped: [],
      publicList: [],
      hasMore: false,
    }
  },
  computed: {
    hasActive() {
      return this.activeCohortId != null
    },
  },
  watch: {
    modelValue(val) {
      this.inner = val
      if (val) this.bootstrap()
    },
    inner(val) {
      this.$emit('update:modelValue', val)
    },
    planId: {
      immediate: true,
      handler() {
        if (this.inner) this.bootstrap()
      },
    },
  },
  methods: {
    close() { this.inner = false },
    async bootstrap() {
      this.page = 1
      this.groupScoped = []
      this.publicList = []
      await this.fetchJoinables()
    },
    async fetchJoinables() {
      this.loading = true
      try {
        const res = await apiClient.get(`/plans/${this.planId}/joinable-cohorts`, { params: { page: this.page, pageSize: this.pageSize } })
        const data = res?.data || {}
        const allPublic = Array.isArray(data.public) ? data.public : []
        const gScoped = Array.isArray(data.groupScoped) ? data.groupScoped : []
        this.groupScoped = gScoped
        if (this.page === 1) this.publicList = allPublic
        else this.publicList = [...this.publicList, ...allPublic]
        this.hasMore = !!data.hasMore
      } catch (e) {
        // swallow
      } finally {
        this.loading = false
      }
    },
    async loadMore() {
      if (!this.hasMore) return
      this.loadingMore = true
      try {
        this.page += 1
        await this.fetchJoinables()
      } finally {
        this.loadingMore = false
      }
    },
    onJoin(cohort) {
      // Emit intent; parent can decide to switch or join
      this.$emit('request-join', { cohort })
    },
    onStartSolo() {
      this.$emit('request-start-solo')
    },
  },
}
</script>

<style scoped>
</style>

