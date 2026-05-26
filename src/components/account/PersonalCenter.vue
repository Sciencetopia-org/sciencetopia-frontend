<template>
  <v-container class="personal-center-container" fluid>
    <div v-if="isPhone" class="mobile-profile">
      <div class="mobile-profile__header">
        <div class="mobile-profile__title">
          {{ isCurrentUser ? $t('usercenter.my') : $t('usercenter.their') }}{{ $t('wordbreaker') }}{{ $t('usercenter.profile') || 'Profile' }}
        </div>
      </div>
      <div class="mobile-profile__swipe-indicator" :aria-label="mobileTabLabel">
        <button
          v-for="item in mobileSwipeItems"
          :key="item.value"
          type="button"
          class="mobile-profile__dot"
          :class="{ 'mobile-profile__dot--active': mobileTab === item.value }"
          :aria-label="item.label"
          @click="goToMobileTab(item.value)"
        />
      </div>
      <div
        class="mobile-profile__window"
        @touchstart.passive="onMobileSwipeStart"
        @touchmove.passive="onMobileSwipeMove"
        @touchend="onMobileSwipeEnd"
        @touchcancel="onMobileSwipeCancel"
      >
        <div
          class="mobile-profile__track"
          :class="{ 'mobile-profile__track--dragging': mobileSwipeDragging }"
          :style="mobileTrackStyle"
        >
          <section class="mobile-profile__pane">
            <div class="mobile-profile__scroll">
              <PersonalInformation :userId="userId">
                <v-btn
                  block
                  variant="outlined"
                  :style="{ backgroundColor: 'white' }"
                  prepend-icon="mdi-email-outline"
                  @click="startOrLoadConversation(userId)"
                >
                  {{ $t('message.sendmessage') }}
                </v-btn>
              </PersonalInformation>
            </div>
          </section>
          <section class="mobile-profile__pane">
            <div class="mobile-profile__scroll">
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
            </div>
          </section>
          <section class="mobile-profile__pane">
            <div class="mobile-profile__scroll">
              <template v-if="loadingGroups">
                <v-skeleton-loader type="list-item-two-line" class="mb-2" />
                <v-skeleton-loader type="list-item-two-line" class="mb-2" />
              </template>
              <v-card v-else-if="studyGroupList.length === 0" class="pa-4">
                {{ isCurrentUser ? $t('studygroup.nogroup_my') : $t('studygroup.nogroup_their') }}
              </v-card>
              <StudyGroupCard
                v-for="group in studyGroupList"
                :key="group.id"
                :group="normalizePersonalGroup(group)"
                action-mode="detail"
                class="mb-3"
                @open="toGroupPage"
                @profile="navigateToProfile"
              />
            </div>
          </section>
          <section class="mobile-profile__pane">
            <v-list class="mobile-profile__more" density="comfortable" nav>
              <v-list-subheader>Sciencetopia</v-list-subheader>
              <v-list-item prepend-icon="mdi-information-outline" :title="$t('footer.about')" :to="{ path: '/about' }" />
              <v-list-item prepend-icon="mdi-email-outline" :title="$t('footer.contact')" :to="{ path: '/contact' }" />
              <v-list-item prepend-icon="mdi-hand-heart-outline" :title="$t('footer.donate')" :to="{ path: '/support' }" />
              <v-divider class="my-2" />
              <v-list-item prepend-icon="mdi-account-cog-outline" :title="$t('usercenter.account') || 'Account'" :to="{ name: 'accountcenter', params: { userId } }" />
            </v-list>
          </section>
        </div>
      </div>
    </div>

    <v-row v-else>
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
import { isPhoneDevice, phoneDeviceRevision } from '@/utils/device'

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
      mobileTab: 'profile',
      mobileSwipeStartX: 0,
      mobileSwipeStartY: 0,
      mobileSwipeDeltaX: 0,
      mobileSwipeDragging: false,
    }
  },
  created() {
    this.fetchDataForUser()
  },
  computed: {
    isCurrentUser() {
      return this.userId === this.currentUserId
    },
    isPhone() {
      phoneDeviceRevision.value
      return isPhoneDevice()
    },
    mobileSwipeItems() {
      return [
        { value: 'profile', label: this.$t('usercenter.profile') || 'Profile' },
        { value: 'plans', label: this.$t('usercenter.studyplan') },
        { value: 'groups', label: this.$t('usercenter.studygroup') },
        { value: 'more', label: this.$t('more') || 'More' },
      ]
    },
    mobileTabLabel() {
      return this.mobileSwipeItems.find((item) => item.value === this.mobileTab)?.label || ''
    },
    mobileTabIndex() {
      return Math.max(0, this.mobileSwipeItems.findIndex((item) => item.value === this.mobileTab))
    },
    mobileTrackStyle() {
      const pagePercent = 100 / Math.max(1, this.mobileSwipeItems.length)
      const base = -this.mobileTabIndex * pagePercent
      const drag = this.mobileSwipeDragging ? this.mobileSwipeDeltaX : 0
      return {
        transform: `translate3d(calc(${base}% + ${drag}px), 0, 0)`,
      }
    },
  },
  methods: {
    goToMobileTab(value) {
      if (!this.mobileSwipeItems.some((item) => item.value === value)) return
      this.mobileTab = value
      this.mobileSwipeDragging = false
      this.mobileSwipeDeltaX = 0
    },
    onMobileSwipeStart(event) {
      const touch = event.touches?.[0]
      if (!touch) return
      this.mobileSwipeStartX = touch.clientX
      this.mobileSwipeStartY = touch.clientY
      this.mobileSwipeDeltaX = 0
      this.mobileSwipeDragging = true
    },
    onMobileSwipeMove(event) {
      if (!this.mobileSwipeDragging) return
      const touch = event.touches?.[0]
      if (!touch) return
      const deltaX = touch.clientX - this.mobileSwipeStartX
      const deltaY = touch.clientY - this.mobileSwipeStartY
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
        this.mobileSwipeDeltaX = 0
        return
      }
      const atFirst = this.mobileTabIndex === 0 && deltaX > 0
      const atLast = this.mobileTabIndex === this.mobileSwipeItems.length - 1 && deltaX < 0
      this.mobileSwipeDeltaX = atFirst || atLast ? deltaX * 0.28 : deltaX
    },
    onMobileSwipeEnd() {
      if (!this.mobileSwipeDragging) return
      const threshold = 64
      const index = this.mobileTabIndex
      if (this.mobileSwipeDeltaX <= -threshold && index < this.mobileSwipeItems.length - 1) {
        this.mobileTab = this.mobileSwipeItems[index + 1].value
      } else if (this.mobileSwipeDeltaX >= threshold && index > 0) {
        this.mobileTab = this.mobileSwipeItems[index - 1].value
      }
      this.mobileSwipeDragging = false
      this.mobileSwipeDeltaX = 0
    },
    onMobileSwipeCancel() {
      this.mobileSwipeDragging = false
      this.mobileSwipeDeltaX = 0
    },
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

.mobile-profile {
  width: 100%;
  max-width: 100%;
  height: calc(100dvh - 82px - env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.mobile-profile__header {
  min-height: 54px;
  padding: calc(8px + env(safe-area-inset-top)) 4px 8px 52px;
  display: flex;
  align-items: center;
}

.mobile-profile__title {
  font-size: 18px;
  font-weight: 700;
}

.mobile-profile__swipe-indicator {
  flex: 0 0 auto;
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2px 0 8px;
}

.mobile-profile__dot {
  width: 8px;
  height: 8px;
  border: 0;
  padding: 0;
  background: rgba(48, 78, 117, 0.28);
  cursor: pointer;
}

.mobile-profile__dot--active {
  width: 22px;
  background: #304e75;
}

.mobile-profile__window {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  touch-action: pan-y;
}

.mobile-profile__track {
  width: 400%;
  height: 100%;
  min-height: 0;
  display: flex;
  will-change: transform;
  transition: transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.mobile-profile__track--dragging {
  transition: none;
}

.mobile-profile__pane {
  flex: 0 0 25%;
  width: 25%;
  max-width: 25%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  transform: translateZ(0);
}

.mobile-profile__scroll {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px;
}

.mobile-profile__more {
  height: 100%;
  overflow-y: auto;
  background: transparent;
  padding: 8px;
}

:global(body.phone-layout) .personal-center-container {
  padding: 0;
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
