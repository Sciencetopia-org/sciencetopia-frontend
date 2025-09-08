<template>
  <v-container fluid>
    <v-row>
      <!-- Left: Plans list -->
      <v-col :cols="3" class="pa-0">
        <template v-if="!leftLoaded">
          <v-card class="left-panel panel-card panel-card--beige" rounded="xl" elevation="2">
            <v-skeleton-loader type="heading" class="px-4 py-2" />
            <v-divider />
            <div class="pa-2">
              <v-skeleton-loader type="list-item" v-for="n in 4" :key="'l-'+n" />
            </div>
          </v-card>
        </template>
        <GroupPlansList v-show="leftLoaded" :groupId="groupId" :activePlanId="planId" @select="onSelectPlan" @loaded="onLeftLoaded" />
      </v-col>

      <!-- Middle: Plan details -->
      <v-col :cols="5">
        <template v-if="!centerLoaded">
          <v-card class="panel-card panel-card--cream" rounded="xl" elevation="2">
            <div class="pa-4">
              <v-skeleton-loader type="heading, text, list-item, list-item, list-item" />
            </div>
          </v-card>
        </template>
        <PlanDetailPanel v-show="centerLoaded" :planId="planId" :scope="{ type: 'group', groupId, shareMode }" :allowEditControls="false" @select-lesson="onSelectLesson" @loaded="onCenterLoaded" />
      </v-col>

      <!-- Right: Lesson details -->
      <v-col :cols="4">
        <LessonDetailPanel :planId="planId" :lessonId="lessonId" :scope="{ type: 'group', groupId, shareMode }" :canInteract="canInteractInGroup" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import GroupPlansList from '@/components/group/GroupPlansList.vue'
import PlanDetailPanel from '@/components/PlanDetailPanel.vue'
import LessonDetailPanel from '@/components/LessonDetailPanel.vue'
import { roleAllowsComment } from '@/services/studyplan-permissions'

export default {
  name: 'GroupPlanWorkspace',
  components: { GroupPlansList, PlanDetailPanel, LessonDetailPanel },
  props: { groupId: { type: [String, Number], required: true }, planId: { type: [String, Number], required: true } },
  data() {
    return { lessonId: this.$route.query.lessonId || null, shareMode: 'Editable', planRole: null, leftLoaded: false, centerLoaded: false }
  },
  computed: {
    canInteractInGroup() { return this.shareMode === 'Editable' && roleAllowsComment(this.planRole) },
  },
  methods: {
    onSelectPlan(pid) { this.$router.push({ name: 'GroupPlanWorkspace', params: { groupId: this.groupId, planId: pid } }) },
    onSelectLesson(id) { this.lessonId = id },
    onLeftLoaded() { this.leftLoaded = true },
    onCenterLoaded() { this.centerLoaded = true },
  },
  watch: {
    groupId() { this.leftLoaded = false },
    planId() { this.centerLoaded = false },
  },
}
</script>

<style scoped>
</style>
