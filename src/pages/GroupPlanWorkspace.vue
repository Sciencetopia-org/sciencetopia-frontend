<template>
  <v-container fluid>
    <v-row>
      <v-col :cols="3">
        <GroupPlansList :groupId="groupId" :activePlanId="planId" @select="onSelectPlan" />
      </v-col>
      <v-col :cols="5">
        <PlanDetailPanel :planId="planId" :scope="{ type: 'group', groupId, shareMode }" :allowEditControls="false" @select-lesson="onSelectLesson" />
      </v-col>
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
    return { lessonId: this.$route.query.lessonId || null, shareMode: 'Editable', planRole: null }
  },
  computed: {
    canInteractInGroup() { return this.shareMode === 'Editable' && roleAllowsComment(this.planRole) },
  },
  methods: {
    onSelectPlan(pid) { this.$router.push({ name: 'GroupPlanWorkspace', params: { groupId: this.groupId, planId: pid } }) },
    onSelectLesson(id) { this.lessonId = id },
  },
}
</script>

<style scoped>
</style>

