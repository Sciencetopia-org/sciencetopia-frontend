<template>
  <v-container class="study-plan-container">
    <v-row>
      <v-col cols="auto">
        <div class="d-flex">
          <v-btn
            :disabled="true"
            icon="dots-vertical"
            class="default-avatar profile-avatar"
            size="48"
          >
            <v-avatar size="46">
              <img :src="avatarUrl" alt="Avatar" />
            </v-avatar>
          </v-btn>
          <v-card-title class="study-plan-title">
            {{ isCurrentUser ? $t('usercenter.my') : $t('usercenter.their')
            }}{{ $t('wordbreaker') }}{{ $t('usercenter.studyplan') }}
          </v-card-title>
        </div>
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

    <div class="study-plan-detail">
      <!-- Active Study Plans -->
      <v-tab-item v-if="activeTab === 0">
        <!-- Study Plan Card -->
        <v-card class="mb-3 study-plan-card">
          <v-card-item>
            <v-row>
              <v-col cols="11">
                <StudyPlan
                  :userId="userId"
                  :studyPlan="studyPlan"
                  @resourceUpdated="handleResourceUpdated"
                />
              </v-col>
              <v-col cols="1" class="d-flex justify-end pt-4 pr-4">
                <v-btn
                  small
                  variant="plain"
                  icon
                  color="primary"
                  @click="
                    $router.push({
                      name: 'personalcenter',
                      params: { userId: userId },
                    })
                  "
                >
                  <div class="return-icon"></div>
                </v-btn>
              </v-col>
            </v-row>
            <v-card-actions class="d-flex justify-end pr-4">
              <v-btn
                small
                variant="text"
                color="red"
                @click="deleteStudyPlan(studyPlan?.title)"
              >
                {{ $t('delete') }}
              </v-btn>
            </v-card-actions>
          </v-card-item>
        </v-card>

        <v-row>
          <v-col
            v-for="studyPlan in activeStudyPlans"
            :key="studyPlan.studyPlan.id"
            cols="12"
          >
            <v-card
              v-if="studyPlan.studyPlan.id != studyPlanId"
              class="study-plan-summary"
            >
              <v-progress-linear
                v-bind="props"
                :model-value="studyPlan.studyPlan.progressPercentage"
                color="text"
                height="15"
                striped
              ></v-progress-linear>
              <!-- <v-spacer style="height: 5px;"></v-spacer> -->
              <v-progress-linear
                v-if="studyPlan.studyPlan.advancedTopicProgressPercentage > 0"
                v-bind="props"
                :model-value="
                  studyPlan.studyPlan.advancedTopicProgressPercentage
                "
                color="accent"
                height="15"
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
      </v-tab-item>
    </div>
  </v-container>
</template>

<script>
import StudyPlan from './StudyPlan.vue'
import { apiClient } from '@/api' // Adjust the path as needed
import { mapState } from 'vuex'

export default {
  name: 'StudyPlanDetail',
  components: {
    StudyPlan,
  },
  data() {
    return {
      activeTab: 0,
      studyPlanDataList: [],
      studyPlanId: this.$route.params.studyPlanId,
      userId: this.$route.params.userId,
      studyPlan: {
        title: '',
        introduction: {
          description: '',
        },
        progressPercentage: 0,
        advancedTopicProgressPercentage: 0,
        prerequisite: [],
        mainCurriculum: [],
        advancedTopics: [],
      },
    }
  },
  computed: {
    ...mapState({
      currentUserId: (state) => state.currentUserID, // Vuex store for current user's ID
    }),
    avatarUrl() {
      return this.isCurrentUser
        ? this.$store.state.avatarUrl
        : this.userInfo.avatarUrl
    },
    isCurrentUser() {
      // Check if the userId passed as a prop matches the current authenticated user
      return this.userId === this.currentUserId
    },
    activeStudyPlans() {
      return this.studyPlanDataList.filter((item) => !item.studyPlan.completed)
    },
    completedStudyPlans() {
      return this.studyPlanDataList.filter((item) => item.studyPlan.completed)
    },
  },
  methods: {
    async fetchDataForUser() {
      try {
        const studyPlanResponse = await apiClient.get(
          `/StudyPlan/FetchStudyPlans`,
          {
            params: { targetUserId: this.userId },
          }
        )
        this.studyPlanDataList = studyPlanResponse.data

        const studyGroupResponse = await apiClient.get(
          `/StudyGroup/GetStudyGroup`,
          {
            params: { targetUserId: this.userId },
          }
        )
        this.studyGroupList = studyGroupResponse.data
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    },
    // Fetch study plan details
    async fetchStudyPlan() {
      try {
        const response = await apiClient.get(`/StudyPlan/GetStudyPlanById`, {
          params: { studyPlanId: this.studyPlanId, targetUserId: this.userId },
        })

        this.studyPlan = response.data.studyPlan

        if (!this.studyPlan) {
          console.error('Study plan not found. Redirecting...')
          this.$router.replace({ name: 'ErrorPage' })
        }
      } catch (error) {
        console.error('Error fetching study plan:', error)
        this.$router.replace({ name: 'ErrorPage' })
      }
    },

    // Handle resource updates
    async handleResourceUpdated() {
      await this.fetchStudyPlan()
    },

    // Delete the study plan
    async deleteStudyPlan(planTitle) {
      if (confirm('Are you sure you want to delete this study plan?')) {
        try {
          const response = await apiClient.delete(
            `/StudyPlan/DeleteStudyPlan`,
            {
              params: { studyPlanTitle: planTitle },
            }
          )

          if (response.status === 200) {
            alert('Study plan deleted successfully.')
            this.$router.replace({ name: 'UserDashboard' }) // Redirect after deletion
          } else {
            throw new Error('Failed to delete the study plan.')
          }
        } catch (error) {
          console.error('Error deleting study plan:', error)
          alert('Failed to delete the study plan.')
        }
      }
    },
    goToPlanDetail(planId) {
      this.$router.push({
        name: 'StudyPlanDetail',
        params: { studyPlanId: planId, userId: this.userId },
      })
    },
  },
  mounted() {
    this.fetchDataForUser()
    this.fetchStudyPlan()
  },
}
</script>

<style scoped>
.study-plan-container {
  background-color: #f4eee1;
  box-shadow: 0px 2px 10px 3px rgba(0, 0, 0, 0.1) !important;
  /* position: absolute;
    top: 8vh;
    left: 50%;
    transform: translateX(-50%); */
}

.study-plan-detail {
  display: flex;
  justify-content: center;
  align-items: center;
}

.study-plan-summary {
  padding: 10px 10px 0 10px;
  width: calc(100% - 80px);
  border: 2px solid #ccc;
  left: 50%;
  transform: translateX(-50%);
}

.study-plan-card {
  margin-top: 10px;
  margin-bottom: 20px !important;
  width: calc(100% - 80px);
  border: 2px solid #ccc;
  left: 50%;
  transform: translateX(-50%);
}

.return-icon {
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 20px solid rgba(236, 0, 23, 0.8);
  position: relative;
  top: -8px;
}

.go-to-icon {
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 20px solid rgba(236, 0, 23, 0.8);
  transform: rotate(90deg);
}
</style>
