<template>
  <GlobalLoader />
  <v-container v-if="!isLoading">
    <div class="group-nav-bar">
      <div class="nav-items">
        <button
          v-for="item in navItems"
          :key="item.value"
          :class="['nav-item', { active: activeNav === item.value }]"
          @click="setActiveNav(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
      <div class="nav-actions">
        <input
          v-model="searchQuery"
          class="search-bar"
          type="text"
          placeholder="搜索学习小组"
        />
        <button class="create-group-btn" @click="toCreateGroupPage">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="24"
            height="24"
            viewBox="0 0 32 32"
          >
            <path
              d="M 12 2 C 6.4889971 2 2 6.4889971 2 12 C 2 17.511003 6.4889971 22 12 22 C 17.511003 22 22 17.511003 22 12 C 22 6.4889971 17.511003 2 12 2 z M 12 4 C 16.430123 4 20 7.5698774 20 12 C 20 16.430123 16.430123 20 12 20 C 7.5698774 20 4 16.430123 4 12 C 4 7.5698774 7.5698774 4 12 4 z M 11 7 L 11 11 L 7 11 L 7 13 L 11 13 L 11 17 L 13 17 L 13 13 L 17 13 L 17 11 L 13 11 L 13 7 L 11 7 z"
            ></path>
          </svg>
          创建学习小组
        </button>
      </div>
    </div>
    <div v-if="filteredGroups.length === 0" class="empty-state">
      <p>
        暂时没有学习小组，去
        <button @click="toCreateGroupPage">创建</button>
        第一个吧！
      </p>
    </div>
    <div ref="masonryContainer" class="masonry-container">
      <div v-for="group in filteredGroups" :key="group.id" class="masonry-item">
        <v-card class="st-card">
          <v-img
            class="group-image"
            @click="toGroupPage(group.id)"
            :src="
              group.imageUrl
                ? require(`@/assets/images/${group.imageUrl}`)
                : require('@/assets/images/default_study_group.png')
            "
            aspect-ratio="16/9"
            cover
          ></v-img>
          <!-- <v-img aspect-ratio="16/9" cover
            :src="group.imageurl ? group.imageurl : require('@/assets/images/default_study_group.png')"></v-img> -->
          <v-card-title>
            <button @click="toGroupPage(group.id)" class="group-name">
              {{ group.name }}
            </button>
          </v-card-title>
          <v-card-text class="group-description">
            {{ group.description }}
          </v-card-text>
          <v-card-text class="group-members">
            小组成员:
            <div class="member-list">
              <v-btn
                v-for="member in group.members"
                :key="member.id"
                icon
                class="default-avatar"
                @click="navigateToProfile(member.id)"
                size="38"
              >
                <v-avatar size="36">
                  <img :src="member.avatarUrl" alt="用户头像" />
                </v-avatar>
              </v-btn>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn v-if="group.isMember" color="primary" text disabled
              >已加入</v-btn
            >
            <template v-else>
              <v-btn color="primary" text @click="applyToJoin(group.id)"
                >申请加入</v-btn
              >
              <v-btn color="primary" text @click="follow(group.id)">关注</v-btn>
            </template>
          </v-card-actions>
        </v-card>
      </div>
    </div>
  </v-container>
</template>

<script>
import { useGlobalLoading } from '../GlobalLoader.vue'
import { mapActions } from 'vuex'
// import { apiClient } from '@/api';
import mockStudyGroup from '../../assets/data/mockStudyGroup.json' // Import the mock data
import Masonry from 'masonry-layout'
import imagesLoaded from 'imagesloaded'

export default {
  name: 'StudyGroupList',
  setup() {
    const { isLoading, showLoading, hideLoading } = useGlobalLoading()

    return {
      isLoading,
      showLoading,
      hideLoading,
    }
  },
  data() {
    return {
      groups: [], // This will be filled with data from the mock file or the backend
      masonryInstance: null,
      navItems: [
        { label: '推荐', value: 'recommend' },
        { label: '已加入', value: 'joined' },
        { label: '关注', value: 'follow' },
        { label: '科普', value: 'popular' },
        { label: '编程', value: 'coding' },
        { label: '哲学', value: 'philosophy' },
        { label: '更多', value: 'more' },
      ],
      activeNav: 'recommend',
      searchQuery: '',
    }
  },
  computed: {
    filteredGroups() {
      if (!this.searchQuery) return this.groups
      const query = this.searchQuery.toLowerCase()
      return this.groups.filter((g) => g.name.toLowerCase().includes(query))
    },
  },
  methods: {
    ...mapActions(['goToProfile']),

    setActiveNav(value) {
      this.activeNav = value
    },

    initMasonry() {
      // Initialize Masonry
      const container = this.$refs.masonryContainer
      this.masonryInstance = new Masonry(container, {
        itemSelector: '.masonry-item',
        columnWidth: '.masonry-item',
        percentPosition: true,
        gutter: 16,
      })

      // Use imagesLoaded to wait for images to load before laying out Masonry
      imagesLoaded(container).on('progress', () => {
        this.masonryInstance.layout() // Recalculate layout for every loaded image
      })
    },

    async fetchGroups() {
      // Use mock data instead of API call
      this.groups = mockStudyGroup

      // Uncomment the following lines to use the actual API
      // this.showLoading();
      // try {
      //   const response = await apiClient.get('/StudyGroup/GetAllStudyGroups');
      //   const groupsWithAvatars = await Promise.all(
      //     response.data.map(async (group) => {
      //       const members = await Promise.all(
      //         group.memberIds.map(async (memberId) => ({
      //           id: memberId.id,
      //           avatarUrl: await this.$store.dispatch('fetchAvatarUrl', memberId.id)
      //         }))
      //       );
      //       const isMember = group.memberIds.some(
      //         (memberId) => memberId.id === this.$store.state.currentUserID
      //       );
      //       console.log('isMember:', isMember);
      //       return { ...group, members, isMember }; // Replace memberIds with members including avatars
      //     })
      //   );
      //   this.groups = groupsWithAvatars;
      // } catch (error) {
      //   console.error('Error fetching groups:', error);
      // } finally {
      //   this.hideLoading(); // Hide loading spinner
      // }
    },

    toCreateGroupPage() {
      this.$router.push('/createstudygroup')
    },
    toGroupPage(groupId) {
      this.$router.push({ name: 'studyGroupPage', params: { groupId } })
    },
    applyToJoin(groupId) {
      console.log(`Applying to join group with ID: ${groupId}`)
    },
    async navigateToProfile(userId) {
      this.goToProfile({ userId, router: this.$router })
    },
  },
  watch: {
    searchQuery() {
      this.$nextTick(() => {
        if (this.masonryInstance) {
          this.masonryInstance.layout()
        }
      })
    },
  },
  mounted() {
    this.fetchGroups()
    this.$nextTick(() => {
      this.initMasonry()
    })
  },
  beforeUnmount() {
    if (this.masonryInstance) {
      this.masonryInstance.destroy() // Clean up Masonry instance
    }
  },
}
</script>

<style scoped>
@import '../../assets/css/avatar.css';

/* Top navigation bar */
.group-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.nav-items {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-bar {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 16px;
  font-size: 14px;
}

.nav-item {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #1c2b42;
  padding: 4px 0;
}

.nav-item.active {
  border-bottom: 2px solid #1c2b42;
  font-weight: bold;
}

/* Container for masonry layout */
.masonry-container {
  position: relative;
}

/* Individual masonry items */
.masonry-item {
  margin-bottom: 24px;
  margin-left: 8px;
  /* Space between items vertically */
  width: 320px;
  /* Adjust dynamically */
}

/* Image styling */
.group-image {
  border-radius: 4px 4px 0 0;
  margin-bottom: 8px;
  cursor: pointer;
}

/* Group name styling */
.group-name {
  font-weight: bold;
  font-size: 1.2rem;
  color: #1c2b42;
  text-align: left;
  margin: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.group-name:hover {
  color: #304e75;
}

/* Group description */
.group-description {
  font-size: 0.9rem;
  color: #304e75;
}

/* Member list styling */
.group-members {
  color: #4a4a4a;
}

.member-list {
  display: flex;
  gap: 5px;
}

.member-avatar {
  cursor: pointer;
}

/* Create group button */
.create-group-btn {
  display: flex;
  align-items: center;
  background-color: #dfcba4;
  border: 1px solid #faf6f0;
  box-shadow: 0 4px 10px 0px #faf6f0;
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 16px;
  cursor: pointer;
}

.create-group-btn svg {
  margin-right: 4px;
}

.create-group-btn:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease-in-out;
  border: 2px solid #faf6f0;
  box-shadow: 0 4px 10px 1px #faf6f0;
}
</style>
