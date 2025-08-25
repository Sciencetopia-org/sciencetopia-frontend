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
        <!-- 搜索框（内嵌放大镜与清除按钮） -->
        <div class="search-wrapper">
          <!-- 左侧放大镜按钮（可点击执行搜索） -->
          <button class="search-icon-btn" @click="performSearch" aria-label="搜索">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          <input
            v-model="searchQuery"
            class="search-bar"
            type="text"
            placeholder="搜索学习小组"
            @input="onSearchInput"
            @keydown.enter.prevent="performSearch"
          />

          <!-- 右侧清除按钮（仅有内容时显示） -->
          <button
            v-if="hasQuery"
            class="clear-btn"
            @click="clearSearch"
            aria-label="清除"
          >
            ×
          </button>

          <!-- 纵向列表建议 -->
          <ul v-if="showSuggestions" class="search-suggestions">
            <li
              v-for="s in suggestions"
              :key="s.id"
              class="suggestion-item"
              @click="selectSuggestion(s.name)"
            >
              {{ s.name }}
            </li>
          </ul>
        </div>

        <!-- 原先的右侧独立搜索按钮已移除 -->
        <button class="create-group-btn" @click="toCreateGroupPage">
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 32 32">
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
        <!-- 下面保持不变 -->
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
          />
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
            <v-btn v-if="group.isMember" color="primary" text disabled>已加入</v-btn>
            <template v-else>
              <v-btn color="primary" text @click="applyToJoin(group.id)">申请加入</v-btn>
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
import mockStudyGroup from '../../assets/data/mockStudyGroup.json'
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
      searchTerm: '',
      showSuggestions: false,
    }
  },
  computed: {
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
      this.masonryInstance = new Masonry(container, {
        itemSelector: '.masonry-item',
        columnWidth: '.masonry-item',
        percentPosition: true,
        gutter: 16,
      })
      imagesLoaded(container).on('progress', () => {
        this.masonryInstance.layout()
      })
    },

    async fetchGroups() {
      this.groups = mockStudyGroup
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
    searchTerm() {
      this.$nextTick(() => {
        if (this.masonryInstance) this.masonryInstance.layout()
      })
    },
  },
  mounted() {
    this.fetchGroups()
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
  width: 280px; /* 可按需调整 */
}

.search-bar {
  width: 100%;
  padding: 8px 36px 8px 36px; /* 为左右内嵌按钮留出空间 */
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
  display: block;            /* 单项独占一行 */
  padding: 8px 12px;
  cursor: pointer;
  white-space: nowrap;       /* 单行展示，过长可改成正常换行 */
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
.masonry-container { position: relative; }
.masonry-item { margin-bottom: 24px; margin-left: 8px; width: 210px; }

.group-image { border-radius: 4px 4px 0 0; margin-bottom: 8px; cursor: pointer; }
.group-name { font-weight: bold; font-size: 1.2rem; color: #1c2b42; text-align: left; margin: 0; border: none; background: none; cursor: pointer; }
.group-name:hover { color: #304e75; }
.group-description { font-size: 0.9rem; color: #304e75; }
.group-members { color: #4a4a4a; }
.member-list { display: flex; gap: 5px; }

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
.create-group-btn svg { margin-right: 4px; }
.create-group-btn:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease-in-out;
  border: 2px solid #faf6f0;
  box-shadow: 0 4px 10px 1px #faf6f0;
}
</style>
