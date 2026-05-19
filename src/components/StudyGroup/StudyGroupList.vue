<template>
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
            <li v-for="s in suggestions" :key="`${s.type}-${s.id || s.value}`" class="suggestion-item" @click="selectSuggestion(s.value)">
              {{ s.value }}
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
        <StudyGroupCard
          :group="group"
          action-mode="join"
          @open="toGroupPage"
          @apply="applyToJoin"
          @profile="navigateToProfile"
        />
      </div>
      <div ref="infiniteSentinel" style="height: 1px;"></div>
      <div v-if="loadingMore" class="infinite-loading"><LoadingSpinner /></div>
    </div>
  </v-container>
</template>
<script>
import { mapActions } from 'vuex'
import { apiClient } from '@/api'
import Masonry from 'masonry-layout'
import imagesLoaded from 'imagesloaded'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import StudyGroupCard from '@/components/StudyGroup/StudyGroupCard.vue'

export default {
  name: 'StudyGroupList',
  components: { LoadingSpinner, StudyGroupCard },
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
      page: 1,
      pageSize: 20,
      hasMore: true,
      loadingMore: false,
      requestId: null,
      suggestionsList: [],
      suggestionTimer: null,
      memberPreviewLoadingIds: new Set(),
    }
  },
  computed: {
    navItems() {
      return [
        { label: this.$t('studygroup.list.nav.recommend'), value: 'recommend' },
        { label: this.$t('studygroup.list.nav.joined'), value: 'joined' },
        { label: this.$t('studygroup.list.nav.popular'), value: 'popular' },
        { label: this.$t('studygroup.list.nav.latest'), value: 'latest' },
      ]
    },
    filteredGroups() {
      return this.groups
    },
    suggestions() {
      return this.suggestionsList
    },
    hasQuery() {
      return !!this.searchQuery?.length
    },
  },
  methods: {
    ...mapActions(['goToProfile']),
    setActiveNav(value) {
      this.activeNav = value
      this.searchTerm = ''
      this.searchQuery = ''
      this.showSuggestions = false
      this.fetchGroups(true)
    },
    onSearchInput() {
      this.showSuggestions = !!this.searchQuery
      clearTimeout(this.suggestionTimer)
      const q = this.searchQuery.trim()
      if (!q) {
        this.suggestionsList = []
        return
      }
      this.suggestionTimer = setTimeout(() => this.fetchSuggestions(q), 220)
    },
    performSearch() {
      this.searchTerm = this.searchQuery.trim()
      this.showSuggestions = false
      this.fetchGroups(true)
    },
    clearSearch() {
      this.searchQuery = ''
      this.searchTerm = ''
      this.showSuggestions = false
      this.suggestionsList = []
      this.fetchGroups(true)
    },
    selectSuggestion(value) {
      this.searchQuery = value
      this.performSearch()
    },
    async fetchSuggestions(q) {
      try {
        const res = await apiClient.get('/StudyGroup/SearchSuggestions', { params: { q, limit: 8 } })
        this.suggestionsList = Array.isArray(res?.data?.items) ? res.data.items : []
        this.showSuggestions = this.suggestionsList.length > 0
      } catch (_) {
        this.suggestionsList = []
      }
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

    async fetchGroups(reset = false) {
      try {
        if (reset) { this.page = 1; this.hasMore = true; this.groups = []; this.memberPreviewLoadingIds.clear() }
        const isFirst = this.page === 1
        if (isFirst) this.loadingGroups = true; else this.loadingMore = true
        const res = this.activeNav === 'joined'
          ? await apiClient.get('/StudyGroup/GetStudyGroup')
          : await apiClient.get('/StudyGroup/Recommendations', { params: this.recommendationParams() })
        const data = res?.data || {}
        let list = this.activeNav === 'joined'
          ? (Array.isArray(data) ? data : [])
          : (Array.isArray(data.items) ? data.items : [])
        if (this.activeNav !== 'joined') this.requestId = data.requestId || null
        if (this.activeNav !== 'joined' && !this.searchTerm && isFirst && list.length === 0) {
          const fallback = await apiClient.get('/StudyGroup/List', { params: { page: this.page, pageSize: this.pageSize } })
          list = Array.isArray(fallback?.data) ? fallback.data : []
          this.requestId = null
        }
        const mapped = list.map(g => this.mapGroup(g))
        this.groups = [...this.groups, ...mapped]
        this.hydrateMissingMemberPreviews(mapped)
        if (list.length < this.pageSize) this.hasMore = false; else this.page += 1
      } catch (e) {
        console.warn('fetchGroups failed', e)
        if (this.activeNav !== 'joined' && !this.searchTerm && this.page === 1) {
          try {
            const fallback = await apiClient.get('/StudyGroup/List', { params: { page: 1, pageSize: this.pageSize } })
            const list = Array.isArray(fallback?.data) ? fallback.data : []
            this.groups = list.map(g => this.mapGroup(g))
            this.hydrateMissingMemberPreviews(this.groups)
            this.hasMore = list.length >= this.pageSize
            if (this.hasMore) this.page = 2
            return
          } catch (_) {
            // keep already loaded groups in case of paging errors
          }
        }
        if (reset) this.groups = []
        this.hasMore = false
      } finally {
        this.loadingGroups = false
        this.loadingMore = false
      }
      // ensure masonry initializes after DOM updates
      this.$nextTick(() => this.initMasonry())
    },
    recommendationParams() {
      const sortMode = {
        recommend: 'personalized',
        popular: 'popular',
        latest: 'latest',
      }[this.activeNav] || 'personalized'
      return {
        page: this.page,
        pageSize: this.pageSize,
        scene: this.searchTerm ? 'search' : 'discover',
        sortMode: this.searchTerm ? 'relevance' : sortMode,
        q: this.searchTerm || undefined,
        excludeJoined: false,
      }
    },
    normalizeMembers(members) {
      return Array.isArray(members)
        ? members.map(member => ({
            id: member?.id || member?.Id || '',
            userName: member?.userName || member?.UserName || member?.name || member?.Name || '',
            avatarUrl: member?.avatarUrl || member?.AvatarUrl || '',
            role: member?.role || member?.Role || '',
          })).filter(member => member.id || member.userName || member.avatarUrl)
        : []
    },
    mapGroup(g) {
      const tags = Array.isArray(g.tags)
        ? g.tags.map(t => ({ id: t.id || t.Id, name: t.name || t.Name || '' })).filter(t => t.name)
        : []
      const reasons = g.recommendation?.reasons || g.Recommendation?.Reasons || []
      const members = g.members || g.Members || g.memberIds || g.MemberIds || []
      return {
        id: g.id || g.Id,
        name: g.name || g.Name || '',
        description: g.description || g.Description || '',
        imageUrl: g.imageUrl || g.ImageUrl || g.imageurl || null,
        members: this.normalizeMembers(members),
        memberCount: typeof g.memberCount === 'number' ? g.memberCount : undefined,
        isMember: !!(g.isMember || g.IsMember || this.activeNav === 'joined'),
        hasApplied: !!(g.hasApplied || g.HasApplied),
        tags,
        recommendationReason: reasons[0]?.text || reasons[0]?.Text || '',
      }
    },
    async hydrateMissingMemberPreviews(groups) {
      const targets = groups
        .filter(group => group?.id && (!Array.isArray(group.members) || group.members.length === 0))
        .filter(group => !this.memberPreviewLoadingIds.has(String(group.id)))

      if (targets.length === 0) return

      await Promise.all(targets.map(async (group) => {
        const groupId = String(group.id)
        this.memberPreviewLoadingIds.add(groupId)
        try {
          const res = await apiClient.get(`/StudyGroup/Bootstrap/${groupId}`)
          const previewGroup = res?.data?.group || res?.data?.Group || res?.data || {}
          const members = this.normalizeMembers(previewGroup.memberIds || previewGroup.MemberIds || previewGroup.members || previewGroup.Members)
          if (members.length === 0) return
          this.groups = this.groups.map(existing => String(existing.id) === groupId ? { ...existing, members } : existing)
        } catch (_) {
          // Keep the card visible; member avatars are an enhancement for recommendation results.
        } finally {
          this.memberPreviewLoadingIds.delete(groupId)
          this.$nextTick(() => {
            if (this.masonryInstance) this.masonryInstance.layout()
          })
        }
      }))
    },
    setupInfiniteScroll() {
      const sentinel = this.$refs.infiniteSentinel
      if (!sentinel) return
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting && this.hasMore && !this.loadingMore && !this.loadingGroups) {
            this.fetchGroups()
          }
        })
      }, { root: null, rootMargin: '200px', threshold: 0 })
      io.observe(sentinel)
      this._io = io
    },

    async toCreateGroupPage() {
      // 使用 Vuex 中的 currentUserID 判断是否登录
      let userId = this.$store?.state?.currentUserID
      if (!userId) {
        try { await this.$store.dispatch('checkAuthenticationStatus') } catch (_) {}
        userId = this.$store?.state?.currentUserID
      }
      if (!userId) {
        this.$toast?.warning?.(this.$t('studygroup.loginToCreate')) || alert(this.$t('studygroup.loginToCreate'))
        // 可选：跳转到登录页：this.$router.push('/login')
        return
      }
      this.$router.push('/createstudygroup')
    },
    toGroupPage(groupId) {
      this.$router.push({ name: 'studyGroupPage', params: { groupId } })
    },
    async applyToJoin(groupId) {
      try {
        await apiClient.post('/StudyGroup/ApplyToJoin', { studyGroupId: String(groupId) })
        this.groups = this.groups.map(g => String(g.id) === String(groupId) ? { ...g, hasApplied: true } : g)
        if (this.requestId) {
          apiClient.post('/StudyGroup/RecommendationFeedback', {
            requestId: this.requestId,
            groupId,
            action: 'apply_join',
            scene: this.searchTerm ? 'search' : 'discover',
          }).catch(() => {})
        }
        this.$toast?.success?.('Application submitted.')
      } catch (_) {
        this.$toast?.error?.(this.$t('operationfailed'))
      }
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
    await this.fetchGroups(true)
    // initMasonry is called in fetchGroups nextTick; keep a safety call
    this.$nextTick(() => this.initMasonry())
    this.$nextTick(() => this.setupInfiniteScroll())
  },
  beforeUnmount() {
    if (this.masonryInstance) this.masonryInstance.destroy()
    try { this._io && this._io.disconnect() } catch (_) {}
    clearTimeout(this.suggestionTimer)
  },
}
</script>
<style scoped>
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

