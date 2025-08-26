<template>
  <v-container fluid class="study-plan-workspace">
    <v-row no-gutters>
      <!-- Left: study plan list -->
      <v-navigation-drawer
        v-model="drawer"
        :rail="collapsed"
        permanent
        class="left-panel"
      >
        <v-list density="compact">
          <v-list-item
            v-for="plan in studyPlans"
            :key="plan.studyPlan.id"
            @click="selectPlan(plan.studyPlan)"
            :class="{
              'selected-plan': currentPlan && currentPlan.id === plan.studyPlan.id,
            }"
          >
            <v-list-item-title>{{ plan.studyPlan.title }}</v-list-item-title>
            <v-progress-linear
              :model-value="plan.studyPlan.progressPercentage"
              height="6"
              color="primary"
            />
            <v-progress-linear
              v-if="plan.studyPlan.advancedTopicProgressPercentage > 0"
              :model-value="plan.studyPlan.advancedTopicProgressPercentage"
              height="6"
              color="accent"
            />
          </v-list-item>
        </v-list>
        <v-divider class="my-2" />
        <v-btn block class="mb-2" @click="openCreateDialog">新建学习计划</v-btn>
        <v-btn block @click="aiDialog = true">AI 生成计划</v-btn>
        <template #append>
          <v-btn icon="mdi-menu-open" @click="collapsed = !collapsed" />
        </template>
      </v-navigation-drawer>

      <!-- Middle: lessons list -->
      <v-col :cols="collapsed ? 7 : 5" class="center-panel">
        <div v-if="currentPlan">
          <v-expansion-panels multiple v-model="openSections">
            <v-expansion-panel title="预备知识" v-if="currentPlan.prerequisite && currentPlan.prerequisite.length">
              <v-expansion-panel-text>
                <v-list density="comfortable">
                  <v-list-item
                    v-for="(lesson, idx) in currentPlan.prerequisite"
                    :key="'pre-' + idx"
                    @click="selectLesson(lesson)"
                    :class="{ 'selected-lesson': currentLesson && currentLesson.name === lesson.name }"
                  >
                    <v-list-item-title>{{ lesson.name }}</v-list-item-title>
                    <v-progress-linear
                      :model-value="lesson.progressPercentage"
                      height="6"
                      color="primary"
                    />
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="主要课程" v-if="currentPlan.mainCurriculum && currentPlan.mainCurriculum.length">
              <v-expansion-panel-text>
                <v-list density="comfortable">
                  <v-list-item
                    v-for="(lesson, idx) in currentPlan.mainCurriculum"
                    :key="'main-' + idx"
                    @click="selectLesson(lesson)"
                    :class="{ 'selected-lesson': currentLesson && currentLesson.name === lesson.name }"
                  >
                    <v-list-item-title>{{ lesson.name }}</v-list-item-title>
                    <v-progress-linear
                      :model-value="lesson.progressPercentage"
                      height="6"
                      color="primary"
                    />
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="进阶内容" v-if="currentPlan.advancedTopics && currentPlan.advancedTopics.length">
              <v-expansion-panel-text>
                <v-list density="comfortable">
                  <v-list-item
                    v-for="(lesson, idx) in currentPlan.advancedTopics"
                    :key="'adv-' + idx"
                    @click="selectLesson(lesson)"
                    :class="{ 'selected-lesson': currentLesson && currentLesson.name === lesson.name }"
                  >
                    <v-list-item-title>{{ lesson.name }}</v-list-item-title>
                    <v-progress-linear
                      :model-value="lesson.progressPercentage"
                      height="6"
                      color="accent"
                    />
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
        <div v-else class="placeholder">请选择一个学习计划</div>
      </v-col>

      <!-- Right: lesson content -->
      <v-col :cols="collapsed ? 5 : 4" class="right-panel">
        <div v-if="currentLesson">
          <h3 class="mb-2">{{ currentLesson.name }}</h3>
          <p>{{ currentLesson.description }}</p>
          <v-list v-if="currentLesson.resources && currentLesson.resources.length">
            <v-list-item
              v-for="(res, idx) in currentLesson.resources"
              :key="idx"
            >
              <template #prepend>
                <v-checkbox
                  v-model="res.learned"
                  @click.stop="markResourceAsLearned(res, currentLesson)"
                />
              </template>
              <v-list-item-title>
                <a :href="res.link" target="_blank">{{ res.link }}</a>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
        <div v-else class="placeholder">请选择一个课程</div>
      </v-col>
    </v-row>

    <!-- AI planner dialog -->
    <v-dialog v-model="aiDialog" max-width="800" @update:model-value="onAiDialogChange">
      <LearningPlanner />
    </v-dialog>

    <!-- Edit / create dialog -->
    <v-dialog v-model="editDialog" max-width="800">
      <EditStudyPlanForm :studyPlan="editPlan" @save="saveStudyPlan" />
    </v-dialog>
  </v-container>
</template>

<script>
import { apiClient } from '@/api'
import LearningPlanner from '@/components/LearningPlanner.vue'
import EditStudyPlanForm from '@/components/EditStudyPlanForm.vue'

export default {
  name: 'StudyPlanWorkspace',
  components: { LearningPlanner, EditStudyPlanForm },
  data() {
    return {
      studyPlans: [],
      currentPlan: null,
      currentLesson: null,
      drawer: true,
      collapsed: false,
      openSections: [0, 1, 2],
      aiDialog: false,
      editDialog: false,
      editPlan: null,
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
        const res = await apiClient.get('/StudyPlan/FetchStudyPlans')
        this.studyPlans = res.data
      } catch (e) {
        console.error('Error fetching study plans:', e)
      }
    },
    selectPlan(plan) {
      this.currentPlan = plan
      this.currentLesson = null
    },
    selectLesson(lesson) {
      this.currentLesson = lesson
    },
    openCreateDialog() {
      this.editPlan = {
        title: '',
        introduction: { description: '' },
        prerequisite: [],
        mainCurriculum: [],
        advancedTopics: [],
      }
      this.editDialog = true
    },
    async saveStudyPlan(plan) {
      try {
        if (plan.id) {
          await apiClient.post('/StudyPlan/UpdateStudyPlan', { studyPlan: plan })
        } else {
          await apiClient.post('/StudyPlan/SaveStudyPlan', { studyPlan: plan })
        }
        this.editDialog = false
        await this.fetchPlans()
      } catch (e) {
        console.error('Error saving study plan:', e)
      }
    },
    async markResourceAsLearned(resource, lesson) {
      const wasLearned = resource.learned
      resource.learned = !wasLearned
      try {
        await apiClient.post('/StudyPlan/LearningLessons/ToggleFinishedLearning', {
          name: lesson.name,
          resourceLink: resource.link,
        })
        this.$store.commit('SET_LEARNING_STATUS', {
          lessonName: lesson.name,
          resourceLink: resource.link,
          learned: resource.learned,
        })
      } catch (e) {
        console.error('Error updating resource learned status:', e)
        resource.learned = wasLearned
      }
    },
    onAiDialogChange(val) {
      if (!val) {
        this.fetchPlans()
      }
    },
  },
}
</script>

<style scoped>
.study-plan-workspace {
  background-color: #f4eee1;
  height: calc(100vh - 64px);
}
.left-panel {
  border-right: 1px solid #ccc;
}
.center-panel {
  border-right: 1px solid #ccc;
  overflow-y: auto;
  max-height: 100%;
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
</style>
