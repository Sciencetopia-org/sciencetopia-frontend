<template>
  <v-container class="manage-panel">
    <v-row>
      <v-col cols="3" class="pa-0">
        <v-card class="left-panel panel-card panel-card--beige" rounded="xl" elevation="2">
          <div class="plan-list-header d-flex align-center px-4 py-2">
            <span class="text-subtitle-1">{{ $t('studygroup.managerboard') }}</span>
          </div>
          <v-divider />
          <v-list density="compact" class="plan-list">
            <v-list-item
              v-for="(item, index) in tabs"
              :key="item.key || index"
              class="plan-card"
              :class="{ 'selected-plan': activeTab === index }"
              @click="activeTab = index"
            >
              <div class="d-flex align-center justify-space-between">
                <v-list-item-title class="text-truncate">{{ item.title }}</v-list-item-title>
                <v-badge v-if="item.key==='requests' && pendingJoinRequests > 0" :content="pendingJoinRequests" color="red" inline />
              </div>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="9" class="pa-3">
        <v-card class="panel-card panel-card--cream pa-4" rounded="xl" elevation="2">
          <keep-alive>
            <component
              :is="currentComponent"
              v-if="currentComponent"
              :key="`${currentTab.key}:${groupId}`"
              v-bind="currentComponentProps"
            />
          </keep-alive>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import GroupOverview from './GroupOverview.vue'
import MemberManagement from './MemberManagement.vue'
import JoinRequests from './JoinRequests.vue'
import ActivityLogs from './ActivityLogs.vue'
import GroupSettingsDialog from './GroupSettingsDialog.vue'

export default {
  props: {
    groupId: [String, Number],
    pendingJoinRequests: Number,
    role: { type: String, default: '' },
    group: { type: Object, default: () => ({}) },
    tags: { type: Array, default: () => [] },
  },
  data() {
    return {
      activeTab: 0, // Default active tab
    }
  },
  watch: {
    tabs() {
      if (this.activeTab >= this.tabs.length) {
        this.activeTab = 0
      }
    },
  },
  components: {
    GroupOverview,
    MemberManagement,
    JoinRequests,
    ActivityLogs,
    GroupSettingsDialog,
  },
  computed: {
    normalizedRole() {
      const v = String(this.role || '').toLowerCase()
      if (v === 'owner') return 'owner'
      if (v === 'admin' || v === 'manager') return 'admin'
      return 'member'
    },
    isManager() {
      return this.normalizedRole === 'owner' || this.normalizedRole === 'admin'
    },
    tabs() {
      const allTabs = [
        { title: this.$t('studygroup.basicinfo'), key: 'overview', component: GroupOverview },
        { title: this.$t('memberMgmt.title'), key: 'members', component: MemberManagement },
        { title: this.$t('studygroup.joinrequest'), key: 'requests', component: JoinRequests },
        { title: this.$t('studygroup.activitylog'), key: 'logs', component: ActivityLogs },
        { title: this.$t('studygroup.groupsetting'), key: 'settings', component: GroupSettingsDialog },
      ]

      return this.isManager
        ? allTabs
        : allTabs.filter((t) => t.key === 'overview' || t.key === 'settings')
    },
    currentTab() {
      return this.tabs[this.activeTab] || { key: 'overview' }
    },
    currentComponent() {
      return this.currentTab.component || GroupOverview
    },
    currentComponentProps() {
      switch (this.currentTab.key) {
        case 'overview':
          return {
            groupId: this.groupId,
            initialGroup: this.group,
            initialTags: this.tags,
            initialRole: this.role,
          }
        case 'members':
        case 'requests':
        case 'logs':
          return { groupId: this.groupId }
        case 'settings':
          return { inline: true, groupId: this.groupId, role: this.isManager ? 'Admin' : 'Member' }
        default:
          return { groupId: this.groupId }
      }
    },
  },
}
</script>

<style scoped>
.manage-panel {
  display: flex;
  flex-direction: row;
  /* background-color: #F4EEE1; */
  height: 92vh;
  position: relative;
  /* box-shadow: 0px 4px 8px 4px rgba(0, 0, 0, 0.05) !important; */
}

.tab-list {
  background-color: #f4eee1;
  padding: 0;
  box-shadow: -8px 4px 8px 0px rgba(0, 0, 0, 0.05) !important;
  height: 100%;
  overflow-y: auto;
}

.tab-content {
  background-color: #f4eee1;
  padding: 0;
  box-shadow: 8px 4px 8px 0px rgba(0, 0, 0, 0.05) !important;
  height: 100%;
  overflow-y: auto;
}

.list-item {
  cursor: pointer;
  padding: 10px;
  padding-bottom: 8px;
  opacity: 1 !important;
  position: relative;
  /* transform: rotate(-30deg); */
  max-width: 300px;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px !important;
    /* Adjust thickness of underline */
    background-color: #ec0017 !important;
    /* Underline color */
    transform: scaleX(0) !important;
    /* Initially hidden */
    transform-origin: left !important;
    /* Animate from left to right */
    transition: transform 0.3s ease-in-out !important;
  }
}

.list-item.active {
  background-color: #e0e0e0;
}

.v-tab-item {
  padding: 20px;
}
</style>
