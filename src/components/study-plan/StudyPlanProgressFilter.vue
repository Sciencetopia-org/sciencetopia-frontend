<template>
  <v-btn-toggle
    :model-value="modelValue"
    mandatory
    density="compact"
    class="plan-progress-filter"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-btn value="all" size="small" prepend-icon="mdi-view-grid-outline">
      {{ $t('studyplan.filters.all') }}
    </v-btn>
    <v-btn value="inProgress" size="small" prepend-icon="mdi-play-circle-outline">
      {{ $t('studyplan.filters.inProgress') }}
    </v-btn>
    <v-btn value="completed" size="small" prepend-icon="mdi-check-circle-outline">
      {{ $t('studyplan.filters.completed') }}
    </v-btn>
  </v-btn-toggle>
</template>

<script>
export default {
  name: 'StudyPlanProgressFilter',
  props: {
    modelValue: {
      type: String,
      default: 'all',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
}
</script>

<style scoped>
.plan-progress-filter {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border: 1px solid rgba(48, 78, 117, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.62);
}

.plan-progress-filter :deep(.v-btn) {
  min-width: 0;
  height: 32px;
  border-radius: 6px !important;
  color: rgba(48, 78, 117, 0.78);
  font-size: 12px;
  letter-spacing: 0;
}

.plan-progress-filter :deep(.v-btn__content) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-progress-filter :deep(.v-btn--active) {
  background: #304e75;
  color: #fff;
  box-shadow: 0 2px 8px rgba(48, 78, 117, 0.22);
}

.plan-progress-filter :deep(.v-btn--disabled) {
  opacity: 0.72;
}
</style>
