<template>
  <v-container class="personal-center-container" fluid>
    <v-row>
      <!-- Personal Information -->
      <v-col cols="12" md="3" class="profile-container">
        <PersonalInformation :userId="userId">
          <v-btn
            variant="outlined"
            :style="{ backgroundColor: 'white' }"
            prepend-icon="mdi-email-outline"
            @click="startOrLoadConversation(userId)"
          >
            <template v-slot:prepend>
              <v-icon color="#ff4d4d"></v-icon>
            </template>
            {{ $t('message.sendmessage') }}
          </v-btn>
        </PersonalInformation>
      </v-col>

      <!-- Study Plans Section -->
      <v-col cols="12" md="5" class="study-plan-container">
        <template v-if="loadingPlans">
          <v-skeleton-loader type="heading" class="mb-4" />
          <v-skeleton-loader type="list-item-two-line" class="mb-2" />
          <v-skeleton-loader type="list-item-two-line" class="mb-2" />
          <v-skeleton-loader type="list-item-two-line" />
        </template>
        <StudyPlanList
          v-else
          :isCurrentUser="isCurrentUser"
          :studyPlanDataList="studyPlanDataList"
        />
      </v-col>

      <!-- Study Groups Section -->
      <v-col cols="12" md="4" class="study-group-container">
        <v-container>
          <v-card-title class="study-group-title">
            {{ isCurrentUser ? $t('usercenter.my') : $t('usercenter.their')
            }}{{ $t('wordbreaker') }}{{ $t('usercenter.studygroup') }}
          </v-card-title>
          <template v-if="loadingGroups">
            <v-skeleton-loader type="list-item-two-line" class="mb-2" />
            <v-skeleton-loader type="list-item-two-line" class="mb-2" />
            <v-skeleton-loader type="list-item-two-line" />
          </template>
          <div v-else-if="studyGroupList.length === 0">
            <v-container>
              <v-card class="d-flex align-center justify-center">
                <v-card-title>
                  {{
                    isCurrentUser
                      ? $t('studygroup.nogroup_my')
                      : $t('studygroup.nogroup_their')
                  }}
                </v-card-title>
              </v-card>
            </v-container>
          </div>
          <v-row v-else>
            <v-col
              v-for="group in studyGroupList"
              :key="group.id"
              cols="12"
              sm="6"
              md="6"
            >
              <v-card class="st-card">
                <v-card-title>
                  {{ group.name }}
                </v-card-title>
                <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
                <v-card-subtitle v-html="group.description"></v-card-subtitle>
                <v-card-text>
                  <v-chip
                    class="group-chip ml-auto"
                    color="text"
                    variant="outlined"
                    label
                    >{{ group.role }}</v-chip
                  >
                  <v-chip
                    class="group-chip ml-auto"
                    variant="outlined"
                    v-if="group.status === 'pending_approval'"
                    color="red"
                    label
                  >
                    {{ group.status }}
                  </v-chip>
                </v-card-text>
                <v-card-actions>
                  <v-btn text @click="toGroupPage(group.id)">
                    {{ $t('showdetail') }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import PersonalInformation from './PersonalInformation.vue'
import StudyPlanList from './StudyPlanList.vue'
import { apiClient } from '@/api'

export default {
  components: {
    PersonalInformation,
    StudyPlanList,
  },
  props: {
    userId: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      studyPlanDataList: [],
      studyGroupList: [],
      activeTab: 0,
      currentUserId: this.$store.state.currentUserID,
      loadingPlans: false,
      loadingGroups: false,
    }
  },
  created() {
    this.fetchDataForUser()
  },
  computed: {
    isCurrentUser() {
      return this.userId === this.currentUserId
    },
  },
  methods: {
    async fetchDataForUser() {
      this.loadingPlans = true
      this.loadingGroups = true
      try {
        const [studyPlanResponse, studyGroupResponse] = await Promise.all([
          apiClient.get(`/StudyPlan/FetchStudyPlans`, {
            params: { targetUserId: this.userId },
          }),
          apiClient.get(`/StudyGroup/GetStudyGroup`, {
            params: { targetUserId: this.userId },
          }),
        ])
        this.studyPlanDataList = studyPlanResponse.data
        this.studyGroupList = studyGroupResponse.data
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        this.loadingPlans = false
        this.loadingGroups = false
      }
    },
    async deleteStudyPlan(planTitle) {
      if (confirm(this.$t('studyplan.confirmdelete'))) {
        try {
          const response = await apiClient.delete(
            `/StudyPlan/DeleteStudyPlan`,
            {
              params: { studyPlanTitle: planTitle },
            }
          )
          if (response.status === 200) {
            alert(this.$t('studyplan.deletesuccess'))
            this.fetchDataForUser()
          } else {
            throw new Error(this.$t('studyplan.deletefailed'))
          }
        } catch (error) {
          console.error('Error deleting study plan:', error)
          alert(this.$t('studyplan.deletefailed'))
        }
      }
    },
    async handleResourceUpdated() {
      await this.fetchDataForUser()
    },
    toGroupPage(groupId) {
      this.$router.push({ name: 'studyGroupPage', params: { groupId } })
    },
    async startOrLoadConversation(otherUserId) {
      const currentUserId = this.currentUserId

      try {
        const conversationData = await this.$root.$signalRConnection.invoke(
          'GetOrStartConversation',
          currentUserId,
          otherUserId
        )

        this.$router.push({
          name: 'directMessages',
          params: { userId: currentUserId },
          query: { conversationId: conversationData.ConversationId },
        })
      } catch (error) {
        console.error('Error starting or loading conversation:', error)
      }
    },
  },
}
</script>

<style scoped>
.personal-center-container {
  padding: 16px;
}

@media (min-width: 960px) {
  .personal-center-container {
    padding-left: 60px;
    padding-right: 60px;
    padding-top: 60px;
  }
}

.profile-container {
  display: flex;
}

.study-group-title {
  font-size: 24px;
  color: #000;
  /* font-weight: bold; */
  padding-bottom: 20px;
}

.group-chip {
  font-size: 12px !important;
  border-radius: 16px;
  margin-right: 2px;
}
</style>
