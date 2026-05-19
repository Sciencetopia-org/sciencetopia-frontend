<template>
  <template v-if="bare">
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
        v-for="p in safeDisplayItems"
        :key="p?.studyPlanId || p?.studyPlanStableId"
        :active="String(p?.studyPlanId) === String(activePlanId)"
        @click="selectPlan(p)"
        class="group-plan-item plan-card"
      >
        <div class="d-flex align-center justify-space-between">
          <v-list-item-title class="text-truncate mr-2">{{ p.planTitle }}</v-list-item-title>
          <div class="d-flex align-center">
            <v-chip v-if="p.enrollMode" size="x-small" label class="mr-2">{{ p.enrollMode }}</v-chip>
            <v-chip v-if="p.pinnedVersionNumber" size="x-small" label class="mr-2">v{{ p.pinnedVersionNumber }}</v-chip>
            <v-chip v-if="p.role" size="x-small" label color="primary">{{ p.role }}</v-chip>
          </div>
        </div>
        <PlanProgressBars
          :loading="false"
          :primaryProgress="normalizePct(p.avgProgress)"
          :advancedProgress="normalizePct(p.advancedAvgProgress)"
          :primaryTooltip="`小组平均学习进度：${Math.round(normalizePct(p.avgProgress) || 0)} %`"
          :advancedTooltip="`小组平均额外学习了${Math.round(normalizePct(p.advancedAvgProgress) || 0)} %的进阶内容`"
          :showAdvancedSkeleton="false"
        />
        <div v-if="p.memberCount" class="text-caption mt-1">{{ p.memberCount }} 人参与</div>
        <div v-if="hasCohorts(p)" class="cohort-strip mt-2">
          <v-chip
            v-for="c in p.cohorts || []"
            :key="c.id"
            size="x-small"
            label
            class="mr-1 mb-1"
            variant="tonal"
          >
            {{ c.title || '班级' }}<span v-if="c.memberCount"> · {{ c.memberCount }} 人</span>
          </v-chip>
        </div>
      </v-list-item>
      <div v-if="errorText" class="text-caption text-error px-2 py-1">{{ errorText }}</div>
      <div v-if="!hasDisplayItems && !errorText" class="text-caption text-medium-emphasis">暂无共享计划</div>
    </v-list>
  </template>
  <template v-else>
    <v-card class="left-panel panel-card panel-card--beige" rounded="xl" elevation="2">
      <div class="plan-list-header d-flex align-center px-4 py-2">
        <span class="text-subtitle-1">组共享的计划</span>
      </div>
      <template v-if="$route.name !== 'studyGroupPage'">
        <v-btn
          class="ma-2"
          color="primary"
          variant="text"
          @click="$router.push({ name: 'studyGroupPage', params: { id: groupId } })"
          prepend-icon="mdi-arrow-left"
        >
          返回学习小组
        </v-btn>
      </template>
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
            v-for="p in safeDisplayItems"
            :key="p?.studyPlanId || p?.studyPlanStableId"
            :active="String(p?.studyPlanId) === String(activePlanId)"
            @click="selectPlan(p)"
            class="group-plan-item plan-card"
          >
            <div class="d-flex align-center justify-space-between">
              <v-list-item-title class="text-truncate mr-2">{{ p.planTitle }}</v-list-item-title>
              <div class="d-flex align-center">
                <v-chip v-if="p.enrollMode" size="x-small" label class="mr-2">{{ p.enrollMode }}</v-chip>
                <v-chip v-if="p.pinnedVersionNumber" size="x-small" label class="mr-2">v{{ p.pinnedVersionNumber }}</v-chip>
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
            <div v-if="hasCohorts(p)" class="cohort-strip mt-2">
              <v-chip
                v-for="c in p.cohorts || []"
                :key="c.id"
                size="x-small"
                label
                class="mr-1 mb-1"
                variant="tonal"
              >
                {{ c.title || '班级' }}<span v-if="c.memberCount"> · {{ c.memberCount }} 人</span>
              </v-chip>
            </div>
          </v-list-item>
          <div v-if="errorText" class="text-caption text-error px-2 py-1">{{ errorText }}</div>
          <div v-if="!hasDisplayItems && !errorText" class="text-caption text-medium-emphasis">暂无共享计划</div>
        </v-list>
      </v-card-text>
    </v-card>
  </template>
</template>

<script>
import { apiClient } from '@/api'
import PlanProgressBars from '@/components/common/PlanProgressBars.vue'

export default {
  name: 'GroupPlansList',
  props: {
    groupId: { type: [String, Number], required: true },
    activePlanId: { type: [String, Number], default: null },
    bare: { type: Boolean, default: false },
  },
  emits: ['select', 'loaded'],
  data() {
    return { items: [], loading: false, q: '', errorText: '' }
  },
  computed: {
    displayItems() {
      const keyword = String(this.q || '').trim().toLowerCase()
      const list = Array.isArray(this.items) ? this.items : []
      if (!keyword) return list
      return list.filter((p) => {
        const planTitle = String(p?.planTitle || '').toLowerCase()
        const cohortTitle = Array.isArray(p?.cohorts)
          ? p.cohorts.some((c) => String(c?.title || '').toLowerCase().includes(keyword))
          : false
        return planTitle.includes(keyword) || cohortTitle
      })
    },
    safeDisplayItems() {
      return Array.isArray(this.displayItems) ? this.displayItems : []
    },
    hasDisplayItems() {
      return this.safeDisplayItems.length > 0
    },
  },
  watch: {
    groupId: { immediate: true, handler() { this.fetchList() } },
  },
  components: { PlanProgressBars },
  methods: {
    normalizePct(v) {
      if (typeof v !== 'number') return undefined
      return v <= 1 ? v * 100 : v
    },
    hasCohorts(plan) {
      return Array.isArray(plan?.cohorts) && plan.cohorts.length > 0
    },
    selectPlan(plan) {
      const planId = plan?.studyPlanId || plan?.studyPlanStableId
      if (!planId) return
      this.$emit('select', planId, plan)
    },
    async fetchList() {
      this.loading = true
      this.errorText = ''
      try {
        const res = await apiClient.get(`/Groups/${this.groupId}/CohortPlans`)
        this.items = Array.isArray(res.data) ? res.data : []
        if (!this.items.length) {
          this.items = await this.fetchBootstrapPlans()
        }
      } catch (_) {
        this.items = await this.fetchBootstrapPlans()
      } finally { this.loading = false; this.$emit('loaded', this.items) }
    },
    async fetchBootstrapPlans() {
      try {
        const res = await apiClient.get(`/StudyGroup/SettingsBootstrap/${this.groupId}`)
        const sharedPlans = Array.isArray(res?.data?.sharedPlans) ? res.data.sharedPlans : []
        const cohorts = Array.isArray(res?.data?.cohorts) ? res.data.cohorts : []
        const cohortsByStableId = new Map()

        cohorts.forEach((cohort) => {
          const stableId = cohort?.planStableId || cohort?.studyPlanStableId || cohort?.StudyPlanStableId
          if (!stableId) return
          const key = String(stableId)
          if (!cohortsByStableId.has(key)) cohortsByStableId.set(key, [])
          cohortsByStableId.get(key).push({
            id: cohort.id,
            title: cohort.title,
            studyPlanId: cohort.planVersionId || cohort.studyPlanId,
            studyPlanStableId: stableId,
            enrollMode: cohort.enrollMode,
            pinnedVersionNumber: cohort.pinnedVersionNumber,
            memberCount: cohort.memberCount || 0,
            avgProgress: cohort.avgProgress || 0,
          })
        })

        return sharedPlans.map((plan) => {
          const stableId = plan.studyPlanStableId || plan.StudyPlanStableId || plan.planStableId
          const planVersionId = plan.planVersionId || plan.PlanVersionId || plan.studyPlanId
          const planCohorts = stableId ? (cohortsByStableId.get(String(stableId)) || []) : []
          const rawMemberCount = plan.memberCount ?? plan.MemberCount ?? plan.uniqueMemberCount ?? plan.UniqueMemberCount
          const providedMemberCount = Number(rawMemberCount)
          return {
            id: planCohorts[0]?.id || null,
            studyPlanId: planVersionId || planCohorts[0]?.studyPlanId || stableId,
            studyPlanStableId: stableId,
            planTitle: plan.title || plan.planTitle || stableId || '未命名学习计划',
            pinnedVersionNumber: plan.pinnedVersionNumber,
            memberCount: Number.isFinite(providedMemberCount)
              ? providedMemberCount
              : planCohorts.reduce((sum, c) => sum + (Number(c.memberCount) || 0), 0),
            avgProgress: planCohorts.length
              ? planCohorts.reduce((sum, c) => sum + (Number(c.avgProgress) || 0), 0) / planCohorts.length
              : 0,
            role: plan.permission || plan.role,
            cohorts: planCohorts,
          }
        })
      } catch (e) {
        this.errorText = e?.response?.status === 403
          ? '你需要先加入该学习小组，才能查看共享计划。'
          : '共享计划加载失败，请刷新或检查后端服务。'
        return []
      }
    },
  },
}
</script>

<style scoped></style>
