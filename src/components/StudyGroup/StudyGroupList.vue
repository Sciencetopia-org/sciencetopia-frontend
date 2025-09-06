<template>
  <GlobalLoader />
  <v-container>
    <div class="group-nav-bar">
      <div class="nav-items">
        <button v-for="item in navItems" :key="item.value" :class="['nav-item', { active: activeNav === item.value }]"
          @click="setActiveNav(item.value)">
          {{ item.label }}
        </button>
      </div>

      <div class="nav-actions">
        <!-- 搜索框（内嵌放大镜与清除按钮） -->
        <div class="search-wrapper">
          <!-- 左侧放大镜按钮（可点击执行搜索） -->
          <button class="search-icon-btn" @click="performSearch" :aria-label="$t('header.search')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          <input v-model="searchQuery" class="search-bar" type="text" :placeholder="$t('studygroup.searchPlaceholder')" @input="onSearchInput"
            @keydown.enter.prevent="performSearch" />

          <!-- 右侧清除按钮（仅有内容时显示） -->
          <button v-if="hasQuery" class="clear-btn" @click="clearSearch" :aria-label="$t('reset')">
            ×
          </button>

          <!-- 纵向列表建议 -->
          <ul v-if="showSuggestions" class="search-suggestions">
            <li v-for="s in suggestions" :key="s.id" class="suggestion-item" @click="selectSuggestion(s.name)">
              {{ s.name }}
            </li>
          </ul>
        </div>

        <!-- 原先的右侧独立搜索按钮已移除 -->
        <button class="create-group-btn" @click="toCreateGroupPage">
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 32 32">
            <path
              d="M 12 2 C 6.4889971 2 2 6.4889971 2 12 C 2 17.511003 6.4889971 22 12 22 C 17.511003 22 22 17.511003 22 12 C 22 6.4889971 17.511003 2 12 2 z M 12 4 C 16.430123 4 20 7.5698774 20 12 C 20 16.430123 16.430123 20 12 20 C 7.5698774 20 4 16.430123 4 12 C 4 7.5698774 7.5698774 4 12 4 z M 11 7 L 11 11 L 7 11 L 7 13 L 11 13 L 11 17 L 13 17 L 13 13 L 17 13 L 17 11 L 13 11 L 13 7 L 11 7 z">
            </path>
          </svg>
          {{ $t('studygroup.create.title') }}
        </button>
      </div>
    </div>

    <div v-if="!loadingGroups && filteredGroups.length === 0" class="empty-state">
      <p>
        {{ $t('studygroup.noGroups') }}，
        <button @click="toCreateGroupPage">{{ $t('add') }}</button>
        {{ $t('studygroup.createFirst') }}
      </p>
    </div>

    <!-- Loading skeleton grid -->
    <div v-if="loadingGroups" class="masonry-container skeleton-grid">
      <div v-for="n in 8" :key="'sk-'+n" class="masonry-item">
        <v-skeleton-loader type="image, heading, text, text, actions" class="st-card" />
      </div>
    </div>

    <div v-else ref="masonryContainer" class="masonry-container">
      <div v-for="group in filteredGroups" :key="group.id" class="masonry-item">
        <!-- 下面保持不变 -->
        <v-card class="st-card">
          <v-img class="group-image" @click="toGroupPage(group.id)" :src="group.imageUrl
              ? require(`@/assets/images/${group.imageUrl}`)
              : require('@/assets/images/default_study_group.png')
            " aspect-ratio="16/9" cover />
          <v-card-title>
            <button @click="toGroupPage(group.id)" class="group-name">
              {{ group.name }}
            </button>
          </v-card-title>
          <v-card-text class="group-description">
            {{ group.description }}
          </v-card-text>
          <v-card-text class="group-members">
            {{ $t('studygroup.groupmember') }}{{ $t(':') }}
            <div class="member-list">
              <v-btn v-for="member in group.members" :key="member.id" icon class="default-avatar"
                @click="navigateToProfile(member.id)" size="38">
                <v-avatar size="36">
                  <img :src="member.avatarUrl" :alt="$t('user.useravatar')" />
                </v-avatar>
              </v-btn>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn v-if="group.isMember" color="primary" text disabled>{{ $t('studygroup.joined') }}</v-btn>
            <template v-else>
              <v-btn color="primary" text @click="applyToJoin(group.id)">{{ $t('studygroup.applytojoin') }}</v-btn>
              <v-btn color="primary" text @click="follow(group.id)">{{ $t('studygroup.follow') }}</v-btn>
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
import { apiClient } from '@/api'
import Masonry from 'masonry-layout'
import imagesLoaded from 'imagesloaded'

export default {
  name: 'StudyGroupList',
  setup() {
    const { isLoading, showLoading, hideLoading } = useGlobalLoading()
    return { isLoading, showLoading, hideLoading }
  },
  data() {
    return {
      groups: [],
      masonryInstance: null,
      // navItems are now computed for i18n
      activeNav: 'recommend',
      searchQuery: '',
      searchTerm: '',
      showSuggestions: false,
      loadingGroups: true,
    }
  },
  computed: {
    navItems() {
      return [
        { label: this.$t('studygroup.list.nav.recommend'), value: 'recommend' },
        { label: this.$t('studygroup.list.nav.joined'), value: 'joined' },
        { label: this.$t('studygroup.list.nav.follow'), value: 'follow' },
        { label: this.$t('studygroup.list.nav.popular'), value: 'popular' },
        { label: this.$t('studygroup.list.nav.coding'), value: 'coding' },
        { label: this.$t('studygroup.list.nav.philosophy'), value: 'philosophy' },
        { label: this.$t('studygroup.list.nav.more'), value: 'more' },
      ]
    },
    filteredGroups() {
      if (!this.searchTerm) return this.groups
      const query = this.searchTerm.toLowerCase()
      return this.groups.filter((g) => g.name.toLowerCase().includes(query))
    },
    suggestions() {
      if (!this.searchQuery) return []
      const query = this.searchQuery.toLowerCase()
      return this.groups.filter((g) => g.name.toLowerCase().includes(query))
    },
    hasQuery() {
      return !!this.searchQuery?.length
    },
  },
  methods: {
    ...mapActions(['goToProfile']),

    setActiveNav(value) {
      this.activeNav = value
    },
    onSearchInput() {
      this.showSuggestions = !!this.searchQuery
    },
    performSearch() {
      this.searchTerm = this.searchQuery.trim()
      this.showSuggestions = false
    },
    clearSearch() {
      this.searchQuery = ''
      this.searchTerm = ''
      this.showSuggestions = false
    },
    selectSuggestion(name) {
      this.searchQuery = name
      this.performSearch()
    },

    initMasonry() {
      const container = this.$refs.masonryContainer
      if (!container) return
      if (!this.masonryInstance) {
        this.masonryInstance = new Masonry(container, {
          itemSelector: '.masonry-item',
          columnWidth: '.masonry-item',
          percentPosition: false, // use fixed px width for stability
          gutter: 16,
        })
      } else {
        this.masonryInstance.reloadItems()
      }
      // Recalculate after images load to avoid zero-width column detection
      imagesLoaded(container).on('always', () => {
        this.masonryInstance.layout()
      })
      // Also perform an immediate layout in case there are no images
      this.masonryInstance.layout()
    },

    async fetchGroups() {
      try {
        this.loadingGroups = true
        const res = await apiClient.get('/StudyGroup/GetAllStudyGroups')
        const list = Array.isArray(res?.data) ? res.data : res?.data?.items || []
        // normalize fields used by UI
        this.groups = list.map(g => ({
          id: g.id,
          name: g.name,
          description: g.description,
          imageUrl: g.imageUrl || g.imageurl || null,
          members: g.members || g.memberIds || [],
          isMember: !!g.isMember,
        }))
      } catch (_) {
        this.groups = []
      } finally {
        this.loadingGroups = false
      }
      // ensure masonry initializes after DOM updates
      this.$nextTick(() => this.initMasonry())
    },

    toCreateGroupPage() {
      // 检查用户是否已登录（假设有 userId 存在于 localStorage 或 vuex）
      const userId = this.$store?.state?.user?.id || localStorage.getItem('userId')
      if (!userId) {
        this.$toast?.warning?.(this.$t('studygroup.loginToCreate')) || alert(this.$t('studygroup.loginToCreate'))
        // this.$router.push('/login')
        return
      }
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
    searchTerm() {
      this.$nextTick(() => {
        if (this.masonryInstance) this.masonryInstance.layout()
      })
    },
  },
  async mounted() {
    await this.fetchGroups()
    // initMasonry is called in fetchGroups nextTick; keep a safety call
    this.$nextTick(() => this.initMasonry())
  },
  beforeUnmount() {
    if (this.masonryInstance) this.masonryInstance.destroy()
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
  padding-top: 16px;
  padding-bottom: 16px;
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

/* ===== 搜索输入（内嵌按钮） ===== */
.search-wrapper {
  position: relative;
  width: 280px;
  /* 可按需调整 */
}

.search-bar {
  width: 100%;
  padding: 8px 36px 8px 36px;
  /* 为左右内嵌按钮留出空间 */
  border: 1px solid #ccc;
  border-radius: 18px;
  font-size: 14px;
  outline: none;
  transition: border-color .15s ease;
  background: #FAF6F0;
}

.search-bar:focus {
  border-color: #1c2b42;
}

/* 左侧放大镜按钮 */
.search-icon-btn {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  padding: 0;
  height: 24px;
  width: 24px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 右侧清除按钮（X） */
.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  padding: 0 6px;
  height: 24px;
  min-width: 24px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: #7a7a7a;
}

.clear-btn:hover {
  color: #333;
}

/* 建议下拉：纵向列表、单列 */
.search-suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 10px;
  list-style: none;
  margin: 0;
  padding: 6px 0;
  max-height: 220px;
  overflow-y: auto;
  z-index: 10;

  /* 强制一列纵向显示 */
  display: block;
}

.suggestion-item {
  display: block;
  /* 单项独占一行 */
  padding: 8px 12px;
  cursor: pointer;
  white-space: nowrap;
  /* 单行展示，过长可改成正常换行 */
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-item:hover {
  background-color: #f5f7fa;
}

/* 原来的独立搜索按钮不再需要
.search-btn { ... }
*/

/* 其余样式保持不变 */
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

/* Masonry */
.masonry-container {
  position: relative;
}

.masonry-item {
  margin-bottom: 24px;
  margin-left: 8px;
  width: 260px;
}

/* Skeleton: simple flex grid to mimic masonry columns before JS layout is ready */
.skeleton-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.skeleton-grid .masonry-item {
  /* reuse same width; spacing controlled via existing margins */
}

/* allow page to scroll when content overflows */
:host,
.v-container {
  overflow: visible;
}

.group-image {
  border-radius: 4px 4px 0 0;
  margin-bottom: 8px;
  cursor: pointer;
}

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

.group-description {
  font-size: 0.9rem;
  color: #304e75;
}

.group-members {
  color: #4a4a4a;
}

.member-list {
  display: flex;
  gap: 5px;
}

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
