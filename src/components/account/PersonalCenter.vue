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
        <StudyPlanList
          :isCurrentUser="isCurrentUser"
          :studyPlanDataList="studyPlanDataList"
          :progressStatus="progressStatus"
          :loading="loadingPlans"
        >
          <template #actions>
            <StudyPlanProgressFilter
              v-model="progressStatus"
              :disabled="loadingPlans"
              @update:model-value="onProgressStatusChanged"
            />
          </template>
        </StudyPlanList>
      </v-col>

      <!-- Study Groups Section -->
      <v-col cols="12" md="4" class="study-group-container">
        <v-container class="study-group-section">
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
            >
              <StudyGroupCard
                :group="normalizePersonalGroup(group)"
                action-mode="detail"
                @open="toGroupPage"
                @profile="navigateToProfile"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import PersonalInformation from './PersonalInformation.vue'
import StudyPlanList from '@/components/study-plan/StudyPlanList.vue'
import StudyPlanProgressFilter from '@/components/study-plan/StudyPlanProgressFilter.vue'
import StudyGroupCard from '@/components/StudyGroup/StudyGroupCard.vue'
import { apiClient } from '@/api'

export default {
  components: {
    PersonalInformation,
    StudyPlanList,
    StudyPlanProgressFilter,
    StudyGroupCard,
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
      // paging/filter for lightweight StudyPlans endpoint
      page: 1,
      pageSize: 20,
      q: null,
      sort: null,
      progressStatus: 'all',
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
      this.loadingGroups = true
      // Fetch study plans and study groups in parallel, but resolve and render independently
      const plansPromise = this.fetchStudyPlansForUser()

      const groupsPromise = apiClient
        .get(`/StudyGroup/GetStudyGroup`, {
          params: { targetUserId: this.userId },
        })
        .then((studyGroupResponse) => {
          this.studyGroupList = studyGroupResponse.data
        })
        .catch((error) => {
          console.error('Error fetching study groups:', error)
        })
        .finally(() => {
          this.loadingGroups = false
        })

      // Optionally wait for both to settle to avoid unhandled rejections
      await Promise.allSettled([plansPromise, groupsPromise])
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
    async onProgressStatusChanged() {
      this.page = 1
      await this.fetchStudyPlansForUser()
    },
    async fetchStudyPlansForUser() {
      this.loadingPlans = true
      try {
        const studyPlanResponse = await apiClient.get(`/StudyPlans`, {
          params: {
            page: this.page,
            pageSize: this.pageSize,
            q: this.q,
            sort: this.sort,
            progressStatus: this.progressStatus,
            ...(this.userId ? { targetUserId: this.userId } : {}),
          },
        })
        const items = Array.isArray(studyPlanResponse.data)
          ? studyPlanResponse.data
          : studyPlanResponse.data?.items || []
        this.studyPlanDataList = items.map((item) => ({
          effectiveRole: item.role || null,
          studyPlan: {
            id: item.id,
            title: item.title,
            introduction: item.description
              ? { description: item.description }
              : null,
            progress: typeof item.progress === 'number'
              ? (item.progress <= 1 ? item.progress * 100 : item.progress)
              : undefined,
            advancedProgress: (() => {
              const val =
                (typeof item.advancedTopicProgressPercentage === 'number' ? item.advancedTopicProgressPercentage : undefined) ??
                (typeof item.advancedProgress === 'number' ? item.advancedProgress : undefined)
              if (typeof val !== 'number') return 0
              return val <= 1 ? val * 100 : val
            })(),
          },
        }))
      } catch (error) {
        console.error('Error fetching study plans:', error)
      } finally {
        this.loadingPlans = false
      }
    },
    toGroupPage(groupId) {
      this.$router.push({ name: 'studyGroupPage', params: { groupId } })
    },
    normalizePersonalGroup(group) {
      return {
        ...group,
        id: group.id || group.Id,
        name: group.name || group.Name || '',
        description: group.description || group.Description || '',
        imageUrl: group.imageUrl || group.ImageUrl || null,
        role: group.role || group.Role || '',
        status: group.status || group.Status || '',
        members: Array.isArray(group.members || group.Members)
          ? (group.members || group.Members)
          : [],
        isMember: true,
      }
    },
    navigateToProfile(userId) {
      if (!userId) return
      this.$router.push({ name: 'personalcenter', params: { userId } })
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

.study-group-section {
  padding: 0;
}
</style>
