<template>
  <div class="group-page">
    <v-container v-if="activeTab === 'studyGroupSpace'">
      <v-row>
        <v-col cols="auto" class="group-info-container">
          <v-card class="group-info-card">
            <template v-if="loadingGroup">
              <v-skeleton-loader type="image" class="mb-4" />
              <v-skeleton-loader type="heading" class="mb-2" />
              <v-skeleton-loader type="text, text" class="mb-2" />
              <v-skeleton-loader type="avatar, avatar, avatar" />
            </template>
            <template v-else>
              <div align="center" style="padding-top: 10px; padding-bottom: 10px">
                <v-img
                  aspect-ratio="16/9"
                  cover
                  style="max-width: 90%; max-height: 40%"
                  :src="groupImageSrc"
                />
              </div>
              <v-card-title>{{ group.name }}</v-card-title>
              <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
              <v-card-subtitle v-html="group.bio"></v-card-subtitle>
              <v-card-text>
                <span v-html="sanitizeHtml(group.description)"></span>
              </v-card-text>
              <div class="mt-2 px-4 pb-2">
                <v-chip v-for="t in tags" :key="t.id || t.Id || t" class="ma-1" size="small" label>
                  {{ t.name || t.Name || t }}
                </v-chip>
              </div>
              <v-card-title class="group-member-title">
                {{ $t('studygroup.groupmember') }}:
                <v-row>
                  <v-col
                    v-for="member in group.memberIds"
                    :key="member.id"
                    cols="auto"
                  >
                    <v-btn
                      icon="dots-vertical"
                      size="40"
                      class="justify-center align-center default-avatar"
                      @click="navigateToProfile(member.id)"
                    >
                      <v-avatar size="38">
                        <img :src="member.avatarUrl" :alt="$t('user.useravatar')" />
                      </v-avatar>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-title>
              <v-spacer style="height: 40px"></v-spacer>
              <v-card-actions class="justify-end group-actions">
                <template v-if="isMember">
                  <v-btn color="primary" text disabled>{{
                    $t('studygroup.joined')
                  }}</v-btn>
                </template>
                <template v-else>
                  <v-btn color="primary" text @click="applyToJoin(group.id)">{{
                    $t('studygroup.applytojoin')
                  }}</v-btn>
                  <v-btn color="primary" text @click="follow(group.id)">{{
                    $t('studygroup.follow')
                  }}</v-btn>
                </template>
                <template v-if="isMember && !isManager">
                  <v-btn
                    color="red"
                    variant="outlined"
                    @click="promptLeaveGroup(groupId)"
                    >{{ $t('cancel') }}</v-btn
                  >

                  <!-- Confirmation Dialog -->
                  <v-dialog v-model="leaveDialog" max-width="600px">
                    <v-card>
                      <!-- Dialog Title with Warning Icon -->
                      <v-card-title class="headline" style="color: red">
                        <v-icon left color="red">mdi-alert-circle</v-icon>
                        {{ $t('operation') }}
                      </v-card-title>

                      <!-- Dialog Content -->
                      <v-card-text>
                        <p>{{ $t('studygroup.groupLeaveMessage') }}</p>
                        <v-spacer style="height: 20px"></v-spacer>
                        <p>{{ $t('studygroup.confirmGroupName') }}</p>
                        <v-spacer style="height: 10px"></v-spacer>
                        <v-text-field
                          v-model="enteredGroupName"
                          :label="$t('studygroup.groupname')"
                          variant="outlined"
                          required
                          color="red"
                        ></v-text-field>
                      </v-card-text>

                      <!-- Dialog Actions with Warning Styling -->
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn
                          color="red darken-1"
                          text
                          @click="confirmLeaveGroup"
                          >{{ $t('confirm') }}</v-btn
                        >
                        <v-btn
                          color="grey darken-1"
                          text
                          @click="cancelLeaveGroup"
                          >{{ $t('cancel') }}</v-btn
                        >
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                </template>
              </v-card-actions>

              <!-- <v-card-title>{{ group.name }}</v-card-title> -->
              <!-- Additional group information -->
              <v-spacer style="height: 40px"></v-spacer>
            </template>
          </v-card>
        </v-col>

        <v-col cols="auto" class="group-space-container">
          <!-- 学习计划：保持与下半部分相同卡片风格，但内部仅显示搜索栏 + 列表 -->
          <v-card class="group-side-card">
            <v-card-title>{{ $t('studygroup.studypath') }}</v-card-title>
            <v-card-text>
              <GroupPlansList :groupId="groupId" :bare="true" @select="goToGroupPlan" />
            </v-card-text>
          </v-card>

          <v-spacer style="height: 20px"></v-spacer>

          <v-card class="group-trend-card">
            <v-card-title>{{ $t('studygroup.grouptrend') }}</v-card-title>
            <v-card-text>
              <p>{{ $t('studygroup.grouptrenddefault') }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <ManagePanel
      v-if="activeTab === 'managePanel'"
      :groupId="groupId"
      :pendingJoinRequests="pendingJoinRequests"
    />

    <v-container v-if="isManager">
      <v-col cols="auto" class="group-sidebar">
        <transition name="slide">
          <v-list-item
            variant="plain"
            class="sidebar-item"
            :to="{ name: 'studyGroupSpace', params: { groupId: groupId } }"
            exact
            :class="{ active: activeTab === 'studyGroupSpace' }"
          >
            <v-list-item-title
              class="sidebar-title"
              :class="{ 'active-title': activeTab === 'studyGroupSpace' }"
              >{{ $t('studygroup.studygroupspace') }}</v-list-item-title
            >
          </v-list-item>
        </transition>
        <transition name="slide">
          <v-list-item
            variant="plain"
            class="sidebar-item"
            :to="{ name: 'managePanel', params: { groupId: groupId } }"
            exact
            :class="{ active: activeTab === 'managePanel' }"
          >
            <v-list-item-title
              class="sidebar-title"
              :class="{ 'active-title': activeTab === 'managePanel' }"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="32"
                height="32"
                viewBox="0 0 22 22"
              >
                <path
                  d="M 6.570313 1 L 6.328125 2.289063 C 5.398438 2.5625 4.570313 3.046875 3.890625 3.695313 L 2.652344 3.261719 L 1.222656 5.738281 L 2.210938 6.585938 C 2.097656 7.042969 2 7.507813 2 8 C 2 8.492188 2.097656 8.957031 2.210938 9.414063 L 1.222656 10.261719 L 2.652344 12.738281 L 3.886719 12.300781 C 4.570313 12.957031 5.398438 13.4375 6.328125 13.714844 L 6.570313 15 L 9.429688 15 L 9.671875 13.714844 C 10.601563 13.4375 11.429688 12.953125 12.109375 12.300781 L 13.34375 12.738281 L 14.777344 10.261719 L 13.785156 9.414063 C 13.898438 8.957031 14 8.492188 14 8 C 14 7.507813 13.902344 7.042969 13.789063 6.585938 L 14.777344 5.738281 L 13.347656 3.261719 L 12.113281 3.695313 C 11.429688 3.042969 10.601563 2.5625 9.671875 2.289063 L 9.429688 1 Z M 7.398438 2 L 8.601563 2 L 8.796875 3.054688 L 9.117188 3.132813 C 10.109375 3.359375 10.984375 3.878906 11.65625 4.597656 L 11.878906 4.835938 L 12.894531 4.480469 L 13.496094 5.519531 L 12.683594 6.21875 L 12.78125 6.53125 C 12.921875 6.992188 13 7.488281 13 8 C 13 8.511719 12.921875 9.003906 12.78125 9.46875 L 12.683594 9.78125 L 13.496094 10.480469 L 12.894531 11.519531 L 11.878906 11.160156 L 11.65625 11.402344 C 10.984375 12.121094 10.109375 12.640625 9.117188 12.871094 L 8.796875 12.941406 L 8.601563 14 L 7.398438 14 L 7.203125 12.941406 L 6.882813 12.871094 C 5.890625 12.640625 5.015625 12.121094 4.34375 11.402344 L 4.117188 11.160156 L 3.101563 11.519531 L 2.503906 10.480469 L 3.316406 9.78125 L 3.21875 9.46875 C 3.078125 9.007813 3 8.511719 3 8 C 3 7.488281 3.078125 6.992188 3.21875 6.53125 L 3.316406 6.21875 L 2.503906 5.519531 L 3.101563 4.480469 L 4.121094 4.835938 L 4.34375 4.597656 C 5.015625 3.878906 5.890625 3.359375 6.882813 3.132813 L 7.203125 3.054688 Z M 8 5 C 6.347656 5 5 6.347656 5 8 C 5 9.652344 6.347656 11 8 11 C 9.652344 11 11 9.652344 11 8 C 11 6.347656 9.652344 5 8 5 Z M 8 6 C 9.109375 6 10 6.890625 10 8 C 10 9.109375 9.109375 10 8 10 C 6.890625 10 6 9.109375 6 8 C 6 6.890625 6.890625 6 8 6 Z"
                ></path></svg
              >{{ $t('studygroup.managerboard') }}
            </v-list-item-title>
          </v-list-item>
        </transition>
        <!-- Sliding Indicator -->
        <div class="sliding-indicator" :style="indicatorStyle"></div>

        <v-badge
          style="margin-left: 20px; margin-bottom: 5px"
          v-if="pendingJoinRequests > 0"
          color="red"
          :content="pendingJoinRequests"
          overlap
        ></v-badge>
      </v-col>
    </v-container>
  </div>
</template>

<script>
import { apiClient } from '@/api'
import ManagePanel from './ManagePanel.vue'
import GroupPlansList from '@/components/StudyGroup/GroupPlansList.vue'
import { mapActions } from 'vuex'

export default {
  props: {
    groupId: [String, Number],
  },
  data() {
    return {
      group: {}, // Group details fetched based on groupId
      role: '', // Role of the current user in the group
      isMember: false, // Whether the current user is a member
      activeTab: 'studyGroupSpace', // Track the active tab
      loadingGroup: true,
      leaveDialog: false, // Show confirmation dialog when leaving group
      enteredGroupName: '', // Entered group name for confirmation
      pendingJoinRequests: 0, // Number of pending join requests
      tags: [],
    }
  },
  watch: {
    $route(to) {
      if (to.name === 'studyGroupSpace') {
        this.activeTab = 'studyGroupSpace'
      } else if (to.name === 'managePanel') {
        this.activeTab = 'managePanel'
      }
    },
  },
  created() {
    this.updateActiveTab()
  },
  computed: {
    indicatorStyle() {
      return {
        transform:
          this.activeTab === 'studyGroupSpace'
            ? 'translateY(0)'
            : 'translateY(100%)',
      }
    },
    normalizedRole() {
      const v = String(this.role || '').toLowerCase()
      if (v === 'owner') return 'owner'
      if (v === 'admin' || v === 'manager') return 'admin'
      return 'member'
    },
    isManager() {
      return this.normalizedRole === 'owner' || this.normalizedRole === 'admin'
    },
    groupImageSrc() {
      const img = this.group?.imageurl || this.group?.imageUrl
      if (!img) return require('@/assets/images/default_study_group.png')
      // Support both absolute URLs and local asset filenames like 'image_resources/image4.jpg'
      return /^https?:\/\//i.test(img) ? img : require(`@/assets/images/${img}`)
    },
  },
  methods: {
    ...mapActions(['goToProfile']), // Map the Vuex action
    sanitizeHtml(html) {
      try { return (require('@/utils/text.js').sanitizeHtml)(html) } catch (_) { return '' }
    },

    updateActiveTab() {
      if (this.$route.name === 'studyGroupSpace') {
        this.activeTab = 'studyGroupSpace'
      } else if (this.$route.name === 'managePanel') {
        this.activeTab = 'managePanel'
      }
    },

    async navigateToProfile(userId) {
      this.goToProfile({ userId, router: this.$router }) // Dispatch the action
    },

    // Fetch group details from the backend
    async fetchGroupDetails(groupId) {
      try {
        const response = await apiClient.get(
          `/StudyGroup/GetStudyGroupById/${groupId}`
        )
        this.group = response.data
        this.isMember = this.group.memberIds.some(
          (memberId) => memberId.id === this.$store.state.currentUserID
        )
      } catch (error) {
        console.error('Error fetching group details:', error)
      }
    },
    // Fetch user role in the group from the backend
    async fetchUserRole(groupId) {
      try {
        const response = await apiClient.get(
          `/StudyGroup/GetUserRoleInGroup/${groupId}`
        )
        this.role = response.data

        if (this.isManager) {
          console.log('Fetching pending join requests...')
          const joinRequestsResponse = await apiClient.get(
            `/StudyGroup/GetPendingJoinRequestsCount/${this.groupId}`
          )
          this.pendingJoinRequests = joinRequestsResponse.data
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    },
    async fetchGroupTags(groupId) {
      try {
        const resp = await apiClient.get(`/StudyGroup/Tags/${groupId}`)
        const list = Array.isArray(resp?.data) ? resp.data : []
        this.tags = list
      } catch (_) {
        this.tags = []
      }
    },
    onTabChange(tabIndex) {
      this.activeTab = tabIndex
      if (this.activeTab === 3 && this.isManager) {
        this.$router.push({
          name: 'managePanel',
          params: { groupId: this.groupId },
        })
      }
    },
    // Triggered when the user clicks the "Leave Group" button
    promptLeaveGroup() {
      this.leaveDialog = true // Show the confirmation dialog
    },

    // Triggered when the user confirms the leave action
    async confirmLeaveGroup() {
      // Validate the entered group name
      if (this.enteredGroupName !== this.group.name) {
        this.$toast.error(this.$t('studygroup.errors.invalidGroupName'))
        return
      }

      // Proceed with the API call to leave the group
      try {
        await apiClient.post('/StudyGroup/LeaveStudyGroup', {
          userId: this.$store.state.currentUserID, // Replace with the actual user ID from the store
          groupId: this.groupId,
        })
        this.$toast.success(this.$t('studygroup.success.leave'))
        this.leaveDialog = false // Close the dialog
        // Optionally redirect or update UI after leaving the group
      } catch (error) {
        console.error('Error leaving group:', error)
        this.$toast.error(this.$t('studygroup.errors.leaveFailed'))
      }
    },

    // Triggered when the user cancels the leave action
    cancelLeaveGroup() {
      this.leaveDialog = false // Close the dialog
      this.enteredGroupName = '' // Reset the input field
    },

    goToGroupPlan(planId) {
      this.$router.push({ name: 'GroupPlanWorkspace', params: { groupId: this.groupId, planId } })
    },
    async applyToJoin(groupId) {
      try {
        await apiClient.post('/StudyGroup/ApplyToJoin', { studyGroupId: String(groupId) })
        this.$toast?.success?.('Application submitted.')
      } catch (_) {
        this.$toast?.error?.(this.$t('operationfailed'))
      }
    },
    follow() {
      this.$toast?.info?.('Follow is not available yet.')
    },
  },
  async mounted() {
    // Fetch group details and user role from the backend on component mount
    try {
      await Promise.all([
        this.fetchGroupDetails(this.groupId),
        this.fetchUserRole(this.groupId),
        this.fetchGroupTags(this.groupId)
      ])
    } finally {
      this.loadingGroup = false
    }
    console.log(
      'this.$vuetify.theme.global.name',
      this.$vuetify.theme.global.name
    )
  },
  components: {
    ManagePanel,
    GroupPlansList,
  },
}
</script>

<style scoped>
.group-page {
  position: relative;
  top: -2vh;
}

.group-info-container {
  width: 38.2%;
  min-height: 84vh;
}

.group-info-card {
  width: 100%;
  height: 100%;
  background-color: #f4eee1;
  padding-left: 40px;
  padding-right: 40px;
  padding-top: 20px;
  padding-bottom: 20px;
  box-shadow: -8px 4px 8px 0px rgba(0, 0, 0, 0.05) !important;
}

.group-info-card .v-card {
  background-color: unset !important;
}

.group-member-title {
  position: absolute;
  bottom: 100px;
}

.group-actions {
  position: absolute;
  bottom: 20px;
  right: 40px;
}

.group-space-container {
  width: 61.8%;
}

/* 移除上半部分“学习计划”卡片背景与阴影，采用轻量容器 */
/* 通用：右列卡片样式，与下半部分一致 */
.group-side-card {
  min-height: 32vh;
  background-color: #f4eee1;
  box-shadow: 8px 4px 8px 0px rgba(0, 0, 0, 0.05) !important;
}

.group-trend-card {
  min-height: 52vh;
  background-color: #f4eee1;
  box-shadow: 8px 4px 8px 0px rgba(0, 0, 0, 0.05) !important;
}

.group-sidebar {
  position: fixed;
  top: 10vh;
  right: 2vw;
  height: 28vh;
  background-color: #f4eee1;
  padding: 0 !important;
  margin: 0 !important;
  width: calc(35px + 0.5vw);
  border-radius: 16px;
}

.active {
  /* background: #DFCBA4;
  border: 1px solid #FAF6F0;
  box-shadow: 0 4px 10px 0px #FAF6F0; */
  /* background-size: 25vw 25vw !important; */
  color: #304e75 !important;
  opacity: 1 !important;
  border-radius: 16px !important;
  z-index: 1;
  transition: all 0.5s ease;
}

.sidebar-item {
  writing-mode: vertical-rl;
  text-orientation: upright;
  height: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.sidebar-title {
  transition:
    font-size 0.3s ease,
    color 0.3s ease;
  font-size: 16px;
  color: #304e75;
}

.sliding-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 110%;
  height: 50%;
  left: -5%;
  background: #dfcba4;
  border-radius: 16px;
  box-shadow: 0 4px 10px 0px #faf6f0;
  transition: transform 0.3s ease-in-out;
  z-index: 0;
}

.sidebar-item.active .sidebar-title {
  font-size: 1.2rem;
  transition: font-size 0.3s ease-in-out;
}

.v-img {
  max-width: 1600px;
  max-height: 500px;
}
</style>

