<template>
  <v-card class="study-plan-card">
    <v-row>
      <v-col cols="auto">
        <v-card-title class="study-plan-title">
          {{ isCurrentUser ? $t('usercenter.my') : $t('usercenter.their')
          }}{{ $t('wordbreaker') }}{{ $t('usercenter.studyplan') }}
        </v-card-title>
      </v-col>
      <v-col cols="auto">
        <v-tabs v-model="activeTab" class="study-plan-tabs">
          <v-tab>
            <p class="study-plan-tab">{{ $t('studyplan.inprogress') }}</p>
          </v-tab>
          <v-tab>
            <p class="study-plan-tab">{{ $t('studyplan.completed') }}</p>
          </v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <!-- Active Study Plans -->
    <v-tab-item v-if="activeTab === 0">
      <v-row>
        <v-col
          v-for="studyPlan in activeStudyPlans"
          :key="studyPlan.id"
          cols="12"
        >
          <v-card
            class="study-plan-summary"
            @click="goToPlanDetail(studyPlan.studyPlan.id)"
          >
            <v-progress-linear
              v-bind="props"
              :model-value="studyPlan.studyPlan.progressPercentage"
              color="text"
              height="10"
              striped
            ></v-progress-linear>
            <!-- <v-spacer style="height: 5px;"></v-spacer> -->
            <v-progress-linear
              v-if="studyPlan.studyPlan.advancedTopicProgressPercentage > 0"
              v-bind="props"
              :model-value="studyPlan.studyPlan.advancedTopicProgressPercentage"
              color="accent"
              height="10"
              striped
            ></v-progress-linear>
            <v-row align="center">
              <v-col cols="4">
                <v-card-title>{{ studyPlan.studyPlan.title }}</v-card-title>
              </v-col>
              <v-col cols="7">
                <v-card-subtitle
                  >已学习{{
                    studyPlan.studyPlan.progressPercentage
                  }}
                  %，额外学习了{{
                    studyPlan.studyPlan.advancedTopicProgressPercentage
                  }}
                  %的进阶内容</v-card-subtitle
                >
              </v-col>
              <v-col cols="1">
                <v-btn
                  variant="plain"
                  icon
                  @click="goToPlanDetail(studyPlan.studyPlan.id)"
                >
                  <div class="go-to-icon"></div>
                </v-btn>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
      <div v-if="activeStudyPlans.length === 0">
        <v-container>
          <v-card class="d-flex align-center justify-center">
            <v-card-title>
              {{
                isCurrentUser
                  ? $t('studyplan.noprogress_my')
                  : $t('studyplan.noprogress_their')
              }}
            </v-card-title>
          </v-card>
        </v-container>
      </div>
    </v-tab-item>

    <!-- Completed Study Plans -->
    <v-tab-item v-if="activeTab === 1">
      <v-row>
        <v-col
          v-for="studyPlan in completedStudyPlans"
          :key="studyPlan.id"
          cols="12"
        >
          <v-card class="study-plan-summary">
            <v-progress-linear
              v-bind="props"
              :model-value="studyPlan.studyPlan.progressPercentage"
              color="text"
              height="10"
              striped
            ></v-progress-linear>
            <!-- <v-spacer style="height: 5px;"></v-spacer> -->
            <v-progress-linear
              v-if="studyPlan.studyPlan.advancedTopicProgressPercentage > 0"
              v-bind="props"
              :model-value="studyPlan.studyPlan.advancedTopicProgressPercentage"
              color="accent"
              height="10"
              striped
            ></v-progress-linear>
            <v-row align="center">
              <v-col cols="4">
                <v-card-title>{{ studyPlan.studyPlan.title }}</v-card-title>
              </v-col>
              <v-col cols="7">
                <v-card-subtitle
                  >已学习{{
                    studyPlan.studyPlan.progressPercentage
                  }}
                  %，额外学习了{{
                    studyPlan.studyPlan.advancedTopicProgressPercentage
                  }}
                  %的进阶内容</v-card-subtitle
                >
              </v-col>
              <v-col cols="1">
                <v-btn
                  variant="plain"
                  icon
                  @click="goToPlanDetail(studyPlan.studyPlan.id)"
                >
                  <div class="go-to-icon"></div>
                </v-btn>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
      <div v-if="completedStudyPlans.length === 0">
        <v-container>
          <v-card class="d-flex align-center justify-center">
            <v-card-title>
              {{
                isCurrentUser
                  ? $t('studyplan.nocompleted_my')
                  : $t('studyplan.nocompleted_their')
              }}
            </v-card-title>
          </v-card>
        </v-container>
      </div>
    </v-tab-item>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      activeTab: 0,
    }
  },
  props: {
    isCurrentUser: Boolean,
    studyPlanDataList: Array,
  },
  computed: {
    activeStudyPlans() {
      return this.studyPlanDataList.filter((item) => !item.studyPlan.completed)
    },
    completedStudyPlans() {
      return this.studyPlanDataList.filter((item) => item.studyPlan.completed)
    },
  },
  methods: {
    goToPlanDetail(planId) {
      this.$router.push({
        name: 'StudyPlanWorkspace',
        query: { planId },
      })
    },
  },
}
</script>

<style scoped>
.study-plan-card {
  margin-top: 10px;
  padding-left: 40px;
  padding-right: 40px;
  padding-top: 20px;
  box-shadow: 0px 2px 10px 3px rgba(0, 0, 0, 0.1) !important;
  background-color: #f4eee1;
  height: 100%;
}

.study-plan-summary {
  padding: 10px 10px 0 10px;
  border: 2px solid #ccc;
}

.go-to-icon {
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 20px solid rgba(236, 0, 23, 0.8);
  transform: rotate(90deg);
}

.study-plan-title {
  font-size: 24px;
  /* font-weight: bold; */
}

.study-plan-tab {
  color: #304e75;
  font-size: 18px;
}
</style>
