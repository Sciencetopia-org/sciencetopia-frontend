<template>
  <v-container fluid class="study-plan-workspace">
    <v-row>
      <!-- Left: study plan list -->
      <v-col :cols="collapsed ? 1 : 3" class="pa-0">
        <v-card rounded="xl" elevation="2" class="left-panel">
          <div class="plan-list-header d-flex align-center px-4 py-2">
            <span class="text-h6">我的学习计划</span>
            <v-spacer />
            <v-btn icon="mdi-plus" variant="text" @click="openCreateDialog" :disabled="backgroundGenerating" />
            <v-btn icon="mdi-robot-outline" variant="text" @click="openAiDialog" :disabled="backgroundGenerating" />
          </div>
          <v-divider />
          <template v-if="loading">
            <v-skeleton-loader type="list-item" v-for="n in 3" :key="n" />
          </template>
          <template v-else-if="studyPlans.length">
            <v-list density="compact">
              <v-list-item
                v-for="plan in studyPlans"
                :key="plan.studyPlan.id"
                @click="selectPlan(plan.studyPlan)"
                class="plan-card"
                :class="{
                  'selected-plan':
                    currentPlan && currentPlan.id === plan.studyPlan.id,
                }"
              >
                <div class="title">{{ plan.studyPlan.title }}</div>
                <v-tooltip
                  :text="`学习进度：${plan.studyPlan.progressPercentage} %`"
                  location="up"
                >
                  <template v-slot:activator="{ props }">
                    <v-progress-linear
                      v-bind="props"
                      :model-value="plan.studyPlan.progressPercentage"
                      color="text"
                      height="15"
                      striped
                    />
                  </template>
                </v-tooltip>
                <v-tooltip
                  v-if="plan.studyPlan.advancedTopicProgressPercentage > 0"
                  :text="
                    `额外学习了${plan.studyPlan.advancedTopicProgressPercentage} %的进阶内容`
                  "
                  location="up"
                >
                  <template v-slot:activator="{ props }">
                    <v-progress-linear
                      v-bind="props"
                      :model-value="
                        plan.studyPlan.advancedTopicProgressPercentage
                      "
                      color="accent"
                      height="15"
                      striped
                    />
                  </template>
                </v-tooltip>
              </v-list-item>
            </v-list>
          </template>
          <div v-else class="empty-plan-list text-center px-4">
            <p class="mb-4">你还没有创建学习计划</p>
            <v-btn
              block
              class="mb-2"
              color="primary"
              @click="openCreateDialog"
              :disabled="backgroundGenerating"
            >
              新建学习计划
            </v-btn>
            <v-btn
              block
              color="secondary"
              @click="openAiDialog"
              :disabled="backgroundGenerating"
            >
              AI 生成计划
            </v-btn>
          </div>
          <div class="d-flex justify-end pa-2">
            <v-btn icon="mdi-menu-open" @click="collapsed = !collapsed" />
          </div>
        </v-card>
      </v-col>

      <!-- Middle: lessons list -->
      <v-col :cols="collapsed ? 6 : 5" class="center-panel">
        <div v-if="loading">
          <v-skeleton-loader type="list-item" v-for="n in 5" :key="n" />
        </div>
        <template v-else>
          <div v-if="currentPlan">
            <v-expansion-panels multiple v-model="openSections">
              <v-expansion-panel
                title="预备知识"
                v-if="currentPlan.prerequisite && currentPlan.prerequisite.length"
              >
                <v-expansion-panel-text>
                  <v-list density="comfortable">
                    <v-list-item
                      v-for="(lesson, idx) in currentPlan.prerequisite"
                      :key="'pre-' + idx"
                      @click="selectLesson(lesson)"
                      :class="{
                        'selected-lesson':
                          currentLesson && currentLesson.name === lesson.name,
                      }"
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
              <v-expansion-panel
                title="主要课程"
                v-if="currentPlan.mainCurriculum && currentPlan.mainCurriculum.length"
              >
                <v-expansion-panel-text>
                  <v-list density="comfortable">
                    <v-list-item
                      v-for="(lesson, idx) in currentPlan.mainCurriculum"
                      :key="'main-' + idx"
                      @click="selectLesson(lesson)"
                      :class="{
                        'selected-lesson':
                          currentLesson && currentLesson.name === lesson.name,
                      }"
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
              <v-expansion-panel
                title="进阶内容"
                v-if="currentPlan.advancedTopics && currentPlan.advancedTopics.length"
              >
                <v-expansion-panel-text>
                  <v-list density="comfortable">
                    <v-list-item
                      v-for="(lesson, idx) in currentPlan.advancedTopics"
                      :key="'adv-' + idx"
                      @click="selectLesson(lesson)"
                      :class="{
                        'selected-lesson':
                          currentLesson && currentLesson.name === lesson.name,
                      }"
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
          <div v-else class="placeholder">
            {{ studyPlans.length ? '请选择一个学习计划' : '尚未创建学习计划' }}
          </div>
        </template>
      </v-col>

      <!-- Right: lesson content -->
      <v-col :cols="collapsed ? 5 : 4" class="right-panel">
        <div v-if="loading">
          <v-skeleton-loader type="text" class="mb-2" />
          <v-skeleton-loader type="list-item" v-for="n in 3" :key="n" />
        </div>
        <div v-else-if="currentLesson">
          <h3 class="mb-2">{{ currentLesson.name }}</h3>
          <p>{{ currentLesson.description }}</p>
          <v-list v-if="currentLesson.resources && currentLesson.resources.length">
            <v-list-item v-for="(res, idx) in currentLesson.resources" :key="idx">
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
    <v-dialog v-model="aiDialog" max-width="800" theme="light" persistent @update:model-value="onAiDialogChange">
      <v-card color="white" rounded="xl">
        <v-card-title class="text-h6">AI 学习计划生成器</v-card-title>
        <v-card-text>
          <!-- 子组件在任一输入变化时 $emit('dirty') -->
          <LearningPlanner @dirty="aiDirty = true" @background="handleBackground" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="attemptClose('ai')">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit / create dialog -->
    <v-dialog v-model="editDialog" max-width="800" theme="light" persistent>
      <v-card color="white" rounded="xl">
        <v-card-title class="text-h6">
          {{ editPlan && editPlan.id ? '编辑学习计划' : '新建学习计划' }}
        </v-card-title>
        <v-card-text>
          <!-- 子组件在任一输入变化时 $emit('dirty') -->
          <EditStudyPlanForm :studyPlan="editPlan" @save="saveStudyPlan" @dirty="editDirty = true" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="attemptClose('edit')">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="backgroundSnackbar" :timeout="backgroundLoading ? -1 : 3000">
      <div class="d-flex align-center">
        <v-progress-circular v-if="backgroundLoading" indeterminate color="white" class="mr-2" />
        <span>{{ backgroundMessage }}</span>
      </div>
    </v-snackbar>

  </v-container>
</template>

<script>
import { apiClient } from '@/api'
import LearningPlanner from '@/components/LearningPlanner.vue'
import EditStudyPlanForm from '@/components/EditStudyPlanForm.vue'
import { eventBus } from '@/eventBus'

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
      aiDirty: false,
      editDirty: false,
      loading: false,
    }
  },
  computed: {
    backgroundGenerating() {
      return this.$store.state.backgroundGenerating
    },
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
      this.loading = true
      try {
        const res = await apiClient.get('/StudyPlan/FetchStudyPlans')
        this.studyPlans = res.data.map((p) => {
          const sections = ['prerequisite', 'mainCurriculum', 'advancedTopics']
          sections.forEach((sec) => {
            if (p.studyPlan[sec]) {
              p.studyPlan[sec] = this.mergeLessons(p.studyPlan[sec])
            }
          })
          return p
        })
      } catch (e) {
        console.error('Error fetching study plans:', e)
      } finally {
        this.loading = false
      }
    },
    mergeLessons(lessons) {
      const map = new Map()
      lessons.forEach((lesson) => {
        const existing = map.get(lesson.name)
        if (existing) {
          const resources = lesson.resources || []
          existing.resources = existing.resources.concat(resources)
        } else {
          map.set(lesson.name, {
            ...lesson,
            resources: lesson.resources ? [...lesson.resources] : [],
          })
        }
      })
      return Array.from(map.values())
    },
    selectPlan(plan) {
      this.currentPlan = plan
      this.currentLesson = null
    },
    selectLesson(lesson) {
      this.currentLesson = lesson
    },
    openCreateDialog() {
      if (this.backgroundGenerating) {
        alert('AI 正在生成学习计划，请稍后再试')
        return
      }
      this.editPlan = {
        title: '',
        introduction: { description: '' },
        prerequisite: [],
        mainCurriculum: [],
        advancedTopics: [],
      }
      this.editDirty = false
      this.editDialog = true
    },
    openAiDialog() {
      if (this.backgroundGenerating) {
        alert('AI 正在生成学习计划，请稍后再试')
        return
      }
      this.aiDialog = true
    },
    async saveStudyPlan(plan) {
      try {
        if (plan.id) {
          await apiClient.post('/StudyPlan/UpdateStudyPlan', {
            studyPlan: plan,
          })
        } else {
          await apiClient.post('/StudyPlan/SaveStudyPlan', { studyPlan: plan })
        }
        this.editDirty = false
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
        await apiClient.post(
          '/StudyPlan/LearningLessons/ToggleFinishedLearning',
          {
            name: lesson.name,
            resourceLink: resource.link,
          }
        )
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
        this.aiDirty = false
      }
    },
    // 统一的关闭入口：只有点右下角按钮才会触发
    attemptClose(which) {
      if (which === 'ai') {
        if (this.aiDirty) {
          const ok = window.confirm('你在对话框中已有输入，确定要关闭吗？未保存的内容将丢失。')
          if (!ok) return
        }
        this.aiDialog = false
        this.aiDirty = false
      } else if (which === 'edit') {
        if (this.editDirty) {
          const ok = window.confirm('你在对话框中已有输入，确定要关闭吗？未保存的内容将丢失。')
          if (!ok) return
        }
        this.editDialog = false
        this.editDirty = false
      }
    },
    handleBackground(promise) {
      this.aiDialog = false
      this.aiDirty = false
      eventBus.emit('background-plan', promise)
      promise.then(() => this.fetchPlans())
    },
  },
}
</script>

<style scoped>
.study-plan-workspace {
  height: calc(100vh - 64px);
}

.left-panel {
  background-color: #e6ddce;
  top: 12px;
  /* display: flex; */
  padding: 16px;
}

.plan-list-header {
  background-color: #e6ddce;
}

.plan-card {
  position: relative;
  overflow: hidden;
  background-color: white;
  border: 1px solid #304e75;
  padding: 10px;
  box-shadow: 0 2px 4px #e8dabd;
  cursor: pointer;
  transition: transform 0.3s ease;
  margin-bottom: 20px;
}

.plan-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.plan-card .title {
  margin: 5px 0;
}

.empty-plan-list {
  margin-top: 40px;
}

.center-panel {
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
