<template>
  <v-container class="plan-page" :class="{ 'plan-page--mobile': isPhone }">
    <div v-if="isPhone" class="mobile-plan-page">
      <div class="mobile-plan-page__header">
        <div class="mobile-plan-page__title">{{ $t('header.studyplan') }}</div>
      </div>
      <v-tabs v-model="mobileTab" density="compact" grow>
        <v-tab value="overview">{{ $t('overview') || 'Overview' }}</v-tab>
        <v-tab value="lesson">{{ $t('studyplan.resource') || 'Resource' }}</v-tab>
      </v-tabs>
      <v-window v-model="mobileTab" touch class="mobile-plan-page__window">
        <v-window-item value="overview" class="mobile-plan-page__pane">
          <div class="mobile-plan-page__scroll">
            <PlanDetailPanel :planId="planId" :scope="{ type: 'me' }" :allowEditControls="false" @select-lesson="onSelectLesson" />
          </div>
        </v-window-item>
        <v-window-item value="lesson" class="mobile-plan-page__pane">
          <div class="mobile-plan-page__scroll">
            <LessonDetailPanel :planId="planId" :lessonId="selectedLessonId" :disabled="false" :canInteract="true" :scope="{ type: 'me' }" @resource-updated="noop" />
          </div>
        </v-window-item>
      </v-window>
    </div>
    <template v-else>
      <PlanDetailPanel :planId="planId" :scope="{ type: 'me' }" :allowEditControls="false" @select-lesson="onSelectLesson" />
      <div class="mt-4" />
      <LessonDetailPanel :planId="planId" :lessonId="selectedLessonId" :disabled="false" :canInteract="true" :scope="{ type: 'me' }" @resource-updated="noop" />
    </template>
  </v-container>
</template>

<script>
import PlanDetailPanel from '@/components/study-plan/PlanDetailPanel.vue'
import LessonDetailPanel from '@/components/study-plan/LessonDetailPanel.vue'
import { isPhoneDevice, phoneDeviceRevision } from '@/utils/device'
export default {
  name: 'PlanPage',
  props: {
    planId: { type: [String, Number], required: true },
  },
  components: { PlanDetailPanel, LessonDetailPanel },
  data() {
    return {
      selectedLessonId: null,
      mobileTab: 'overview',
    }
  },
  methods: {
    onSelectLesson(lessonId) {
      this.selectedLessonId = lessonId
      if (this.isPhone) this.mobileTab = 'lesson'
    },
    noop() {},
  },
  computed: {
    isPhone() {
      phoneDeviceRevision.value
      return isPhoneDevice()
    },
  },
}
</script>

<style scoped>
.plan-page--mobile {
  padding: 0;
}

.mobile-plan-page {
  width: 100%;
  max-width: 100%;
  height: calc(100dvh - 82px - env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.mobile-plan-page__header {
  min-height: 54px;
  padding: calc(8px + env(safe-area-inset-top)) 4px 8px 52px;
  display: flex;
  align-items: center;
}

.mobile-plan-page__title {
  font-size: 18px;
  font-weight: 700;
}

.mobile-plan-page__window {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.mobile-plan-page__pane,
.mobile-plan-page__pane :deep(.v-window-item__content) {
  height: 100%;
  min-height: 0;
}

.mobile-plan-page__scroll {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px;
}
</style>

