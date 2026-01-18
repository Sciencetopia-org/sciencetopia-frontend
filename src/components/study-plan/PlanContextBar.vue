<template>
  <div class="plan-context-bar d-flex align-center mb-2">
    <v-chip
      :color="scope?.type==='me' ? 'primary' : ''"
      label
      class="mr-2"
      @click="$emit('change', { type: 'me' })"
    >{{ $t('plan.scope.me') }}</v-chip>

    <template v-for="g in groups" :key="g.groupId">
      <v-chip
        :color="isActiveGroup(g) ? 'primary' : ''"
        label
        class="mr-2"
        @click="$emit('change', { type: 'group', groupId: String(g.groupId), shareMode: g.shareMode || 'Editable' })"
      >{{ $t('plan.scope.group') }}：{{ g.groupName }}</v-chip>
    </template>

    <v-spacer />
    <v-btn size="small" variant="text" color="primary" v-if="scope?.type==='group'" @click="$emit('open-group', scope.groupId)">{{ $t('plan.openGroupView') }}</v-btn>
  </div>
</template>

<script>
export default {
  name: 'PlanContextBar',
  props: {
    scope: { type: Object, required: true },
    groups: { type: Array, default: () => [] },
  },
  emits: ['change', 'open-group'],
  methods: {
    isActiveGroup(g) {
      return this.scope?.type === 'group' && String(this.scope.groupId) === String(g.groupId)
    },
  },
}
</script>

<style scoped>
.plan-context-bar { padding-top: 6px; }
</style>

