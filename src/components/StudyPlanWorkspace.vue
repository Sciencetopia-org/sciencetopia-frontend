<template>
  <v-container fluid class="study-plan-workspace">
    <v-row>
      <!-- Left column: list of study plans -->
      <v-col cols="3" class="left-panel">
        <v-list nav dense>
          <v-list-item
            v-for="plan in studyPlans"
            :key="plan.studyPlan.id"
            @click="selectPlan(plan.studyPlan)"
            :class="{ 'selected-plan': currentPlan && currentPlan.id === plan.studyPlan.id }"
          >
            <v-list-item-title>{{ plan.studyPlan.title }}</v-list-item-title>
            <v-progress-linear
              :model-value="plan.studyPlan.progressPercentage"
              height="6"
              color="primary"
            />
          </v-list-item>
        </v-list>
      </v-col>

      <!-- Middle column: lessons graph (simplified timeline) -->
      <v-col cols="5" class="center-panel">
        <div v-if="currentPlan">
          <v-timeline density="compact">
            <v-timeline-item
              v-for="(lesson, index) in currentPlan.mainCurriculum"
              :key="index"
              :title="lesson.name"
              :class="{ 'selected-lesson': currentLesson && currentLesson.name === lesson.name }"
              @click="selectLesson(lesson)"
            />
          </v-timeline>
        </div>
        <div v-else class="placeholder">请选择一个学习计划</div>
      </v-col>

      <!-- Right column: lesson content -->
      <v-col cols="4" class="right-panel">
        <div v-if="currentLesson">
          <h3>{{ currentLesson.name }}</h3>
          <p>{{ currentLesson.description }}</p>
          <div v-if="currentLesson.resources && currentLesson.resources.length">
            <div
              v-for="(res, idx) in currentLesson.resources"
              :key="idx"
              class="resource-link"
            >
              <a :href="res.link" target="_blank">{{ res.link }}</a>
            </div>
          </div>
        </div>
        <div v-else class="placeholder">请选择一个课程</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import apiClient from '@/api'

export default {
  name: 'StudyPlanWorkspace',
  data() {
    return {
      studyPlans: [],
      currentPlan: null,
      currentLesson: null,
    }
  },
  async created() {
    await this.fetchPlans()
    const planId = this.$route.query.planId
    if (planId) {
      const selected = this.studyPlans.find(
        (p) => String(p.studyPlan.id) === String(planId)
      )
      if (selected) {
        this.selectPlan(selected.studyPlan)
      }
    }
  },
  methods: {
    async fetchPlans() {
      try {
        const res = await apiClient.get(`/StudyPlan/FetchStudyPlans`)
        this.studyPlans = res.data
      } catch (e) {
        console.error('Error fetching study plans:', e)
      }
    },
    selectPlan(plan) {
      this.currentPlan = plan
      this.currentLesson = plan.mainCurriculum[0] || null
    },
    selectLesson(lesson) {
      this.currentLesson = lesson
    },
  },
}
</script>

<style scoped>
.study-plan-workspace {
  height: calc(100vh - 64px);
}
.left-panel {
  overflow-y: auto;
  max-height: 100%;
}
.center-panel {
  overflow-y: auto;
  max-height: 100%;
  display: flex;
  justify-content: center;
}
.right-panel {
  overflow-y: auto;
  max-height: 100%;
  padding: 16px;
}
.selected-plan {
  background-color: #e0e0e0;
}
.selected-lesson {
  font-weight: bold;
}
.placeholder {
  color: #999;
  text-align: center;
  width: 100%;
  margin-top: 20px;
}
.resource-link {
  margin-bottom: 8px;
}
</style>
