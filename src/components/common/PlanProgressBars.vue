<template>
  <div>
    <v-tooltip :text="primaryTooltip" location="right" open-delay="300">
      <template #activator="{ props }">
        <template v-if="loading">
          <v-skeleton-loader type="text" class="mt-2" style="height:6px" />
        </template>
        <v-progress-linear
          v-else-if="isNumber(primaryProgress)"
          v-bind="props"
          :model-value="primaryProgress"
          height="6"
          color="primary"
          rounded
          class="mt-2"
        />
      </template>
    </v-tooltip>

    <v-tooltip :text="advancedTooltip" location="right" open-delay="300">
      <template #activator="{ props }">
        <template v-if="loading && showAdvancedSkeleton">
          <v-skeleton-loader type="text" class="mt-1" style="height:6px" />
        </template>
        <v-progress-linear
          v-else-if="showAdvanced"
          v-bind="props"
          :model-value="advancedProgress"
          height="6"
          color="accent"
          rounded
          class="mt-1"
        />
      </template>
    </v-tooltip>
  </div>
</template>

<script>
export default {
  name: 'PlanProgressBars',
  props: {
    primaryProgress: { type: Number, default: undefined },
    advancedProgress: { type: Number, default: 0 },
    loading: { type: Boolean, default: false },
    primaryTooltip: { type: String, default: (/* istanbul ignore next */) => `学习进度：0 %` },
    advancedTooltip: { type: String, default: (/* istanbul ignore next */) => `额外学习了0 %的进阶内容` },
    showAdvancedSkeleton: { type: Boolean, default: true },
  },
  computed: {
    showAdvanced() {
      return this.isNumber(this.advancedProgress) && this.advancedProgress > 0
    },
  },
  methods: {
    isNumber(v) { return typeof v === 'number' && !isNaN(v) }
  }
}
</script>

<style scoped>
</style>

