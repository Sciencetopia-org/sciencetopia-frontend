<template>
  <v-container class="pa-4">
    <PlanDetailPanel :planId="planId" :scope="{ type: 'me' }" :allowEditControls="false" @select-lesson="onSelectLesson" />
    <div class="mt-4" />
    <LessonDetailPanel :planId="planId" :lessonId="selectedLessonId" :disabled="false" :canInteract="true" :scope="{ type: 'me' }" @resource-updated="noop" />
  </v-container>
</template>

<script>
import PlanDetailPanel from '@/components/study-plan/PlanDetailPanel.vue'
import LessonDetailPanel from '@/components/study-plan/LessonDetailPanel.vue'
export default {
  name: 'PlanPage',
  props: {
    planId: { type: [String, Number], required: true },
  },
  components: { PlanDetailPanel, LessonDetailPanel },
  data() {
    return {
      selectedLessonId: null,
    }
  },
  methods: {
    onSelectLesson(lessonId) { this.selectedLessonId = lessonId },
    noop() {},
  },
}
</script>

<style scoped>
</style>

