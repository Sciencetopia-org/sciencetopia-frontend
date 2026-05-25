<template>
  <div class="large-header">
    <v-container class="header-grid" fluid>
      <!-- Icons (nav + actions) -->
      <div class="icons-section">
        <!-- 搜索图标 / Search -->
        <ReusableIconButton icon="mdi-magnify" :label="$t('header.search')" :iconSize="iconSize"
          @click="openSearchInput" />

        <!-- 学习计划 / StudyPlan -->
        <ReusableIconButton icon="mdi-book-open-variant" :label="$t('header.studyplan')" :iconSize="iconSize"
          :active="activeKey==='studyplan'" @click="handleStudyPlan" />

        <!-- 学习小组 / StudyGroup -->
        <ReusableIconButton icon="mdi-account-group" :label="$t('header.studygroup')" :iconSize="iconSize"
          :active="activeKey==='studygroup'" @click="RouteToStudyGroup" />

        <!-- 趋势 / Trend -->
        <ReusableIconButton icon="mdi-rss" :label="$t('header.trend')" :iconSize="iconSize"
          :active="activeKey==='trend'" @click="scrollToSection" />

        <!-- 登录 / Login (handled by LogInPartial) -->
        <LogInPartial :is-small-screen="isSmallScreen" :icon-size="iconSize" />

        <!-- 消息 / Messages -->
        <MessageAlert :is-small-screen="isSmallScreen" :icon-size="iconSize" />

        <!-- 明/暗模式切换 -->
        <!-- <ReusableIconButton :icon="themeIcon" :label="themeLabel" :iconSize="iconSize" @click="toggleTheme" /> -->

        <!-- 语言切换栏 -->
        <v-btn class="language-toggle" variant="text" @click="toggleLanguage" :aria-label="$t('header.languageSwitch')">
          <v-icon size="24">mdi-translate</v-icon>
        </v-btn>
      </div>

      <!-- <div class="language-section">
        <div class="language-button-container">
        </div>
      </div> -->
    </v-container>

    <!-- 搜索对话框 -->
    <!-- <v-dialog v-model="searchDialogOpen" max-width="600px" class="search-dialog">
      <v-card>
        <v-card-text>
          <v-text-field v-model="searchQuery" :placeholder="$t('searchbar.iwanttolearn')" variant="outlined"
            density="comfortable" hide-details clearable @keydown.enter.prevent="globalSearch"
            append-inner-icon="mdi-magnify" @click:append-inner="globalSearch" class="search-input-dialog" autofocus />
        </v-card-text>
      </v-card>
    </v-dialog> -->
  </div>

  <!-- Logo Island -->
  <div class="logo-island">
    <v-btn variant="plain" class="logo-btn" @click.prevent="backToHomePage">
      <img :src="smallLogo" alt="Logo" class="responsive-logo" />
    </v-btn>
  </div>
</template>

<script>
import { debounce } from 'lodash-es'
import MessageAlert from '@/components/messaging/MessageAlert.vue'
import LogInPartial from '@/components/auth/LogInPartial.vue'
import ReusableIconButton from '@/components/ui/ReusableIconButton.vue'
import { eventBus } from '@/eventBus'

export default {
  name: 'HeaderBar',
  emits: ['showStudyPlanDialog'],
  components: {
    MessageAlert,
    LogInPartial,
    ReusableIconButton,
  },
  data() {
    return {
      isDarkThemeEnabled: false,
      searchQuery: '',
      largeLogo: require('@/assets/images/logo_banner.png'),
      smallLogo: require('@/assets/images/logo.png'),
      isSmallScreen: window.innerWidth <= 1200,
      langTextWidth: 0,
      activeKey: '',
    }
  },
  computed: {
    languageOptions() {
      return [
        { title: this.$t('languages.en'), value: 'en' },
        { title: this.$t('languages.zh'), value: 'zh' },
      ]
    },
    isAuthenticated() {
      return this.$store.state.isAuthenticated
    },
    iconSize() {
      // 大屏用 32，小屏用 24
      return this.isSmallScreen ? 24 : 32
    },
    themeIcon() {
      return this.isDarkThemeEnabled ? 'mdi-weather-night' : 'mdi-weather-sunny'
    },
    themeLabel() {
      return this.isDarkThemeEnabled
        ? this.$t('header.darkmode')
        : this.$t('header.lightmode')
    },
    computeLangWidthStyle() {
      const baseWidth = this.langTextWidth || 30
      const minW = 1.1 * baseWidth
      const maxW = 2 * baseWidth
      return {
        minWidth: `${minW}px`,
        maxWidth: `${maxW}px`,
      }
    },
    currentLanguageLabel() {
      const currentLang = this.languageOptions.find(
        (item) => item.value === this.$i18n.locale
      )
      return currentLang ? currentLang.title : ''
    },
    nextLanguageLabel() {
      const nextLang = this.languageOptions.find(
        (item) => item.value !== this.$i18n.locale
      )
      return nextLang ? nextLang.title : ''
    },
  },
  methods: {
    updateActiveFromRoute() {
      const name = this.$route?.name
      if (name === 'StudyPlanWorkspace' || name === 'PlanPage' || name === 'StudyPlanDetail') {
        this.activeKey = 'studyplan'
      } else if (
        name === 'studyGroupList' ||
        name === 'studyGroupPage' ||
        name === 'GroupPlanWorkspace' ||
        name === 'createStudyGroup' ||
        name === 'managePanel' ||
        name === 'studyGroupSpace'
      ) {
        this.activeKey = 'studygroup'
      } else if (name === 'allFeeds') {
        this.activeKey = 'trend'
      } else {
        this.activeKey = ''
      }
    },
    openSearchInput() {
      eventBus.emit('show-search-bar')
    },
    handleResize() {
      this.isSmallScreen = window.innerWidth <= 1200
    },
    toggleTheme() {
      this.isDarkThemeEnabled = !this.isDarkThemeEnabled
      // Vuetify 主题切换
      this.$vuetify.theme.dark = this.isDarkThemeEnabled
      // 可选：持久化
      localStorage.setItem('isDarkThemeEnabled', this.isDarkThemeEnabled)
    },
    backToHomePage() {
      this.$router.push({ name: 'HomePage' })
    },
    scrollToSection() {
      this.activeKey = 'trend'
      this.$router.push({ name: 'allFeeds' })
    },
    // async globalSearch() {
    //   const query = this.searchQuery.trim()
    //   if (!query) {
    //     console.log('Search query is empty!')
    //     return
    //   }
    //   const path = this.$router.resolve({
    //     name: 'searchList',
    //     query: { q: query },
    //   }).href
    //   window.open(path, '_blank')
    //   this.searchDialogOpen = false
    // },
    RouteToStudyGroup() {
      this.activeKey = 'studygroup'
      this.$router.push({ name: 'studyGroupList' })
    },
    async handleStudyPlan() {
      const userId = await this.ensureUserId()
      if (!userId) return

      this.activeKey = 'studyplan'
      this.$router.push({ name: 'StudyPlanWorkspace', params: { userId } })
    },
    toggleLanguage() {
      const currentIndex = this.languageOptions.findIndex(
        (item) => item.value === this.$i18n.locale
      )
      const nextIndex = (currentIndex + 1) % this.languageOptions.length
      const next = this.languageOptions[nextIndex].value
      this.$i18n.locale = next
      // Map app locale to Vuetify built-in locale keys
      const vLocale = next === 'zh' ? 'zhHans' : 'en'
      try { this.$vuetify.locale.current = vLocale } catch (_) {}
      try { localStorage.setItem('locale', next) } catch (_) {}
      // Notify app parts (e.g., KnowledgeGraph) to refresh with new lang
      try { window.dispatchEvent(new CustomEvent('app:lang-changed', { detail: next })) } catch (_) {}
    },
    measureLangTextWidth() {
      const tempSpan = document.createElement('span')
      const selectedItem = this.languageOptions.find(
        (item) => item.value === this.$i18n.locale
      )
      const text = selectedItem ? selectedItem.title : ''
      tempSpan.innerText = text
      tempSpan.style.position = 'absolute'
      tempSpan.style.visibility = 'hidden'
      tempSpan.style.whiteSpace = 'nowrap'
      tempSpan.style.fontSize = '14px'
      document.body.appendChild(tempSpan)
      this.langTextWidth = tempSpan.offsetWidth
      document.body.removeChild(tempSpan)
    },
    async ensureUserId() {
      let userId = this.$store.state.currentUserID

      if (!userId) {
        try {
          await this.$store.dispatch('checkAuthenticationStatus')
        } catch (err) {
          console.error('Failed to refresh authentication status before navigation', err)
        }
        userId = this.$store.state.currentUserID
      }

      const isAuthenticated = this.$store.state.isAuthenticated
      if (!isAuthenticated || !userId) {
        alert(this.$t('header.pleaseLoginToViewStudyPlan'))
        return null
      }

      return userId
    },
  },
  created() {
    this.debouncedResize = debounce(this.handleResize, 100)
    this.$root.isSmallScreen = this.isSmallScreen
    this.handleResize()
  },
  mounted() {
    window.addEventListener('resize', this.debouncedResize)
    this.measureLangTextWidth()
    const storedTheme = localStorage.getItem('isDarkThemeEnabled')
    if (storedTheme !== null) {
      this.isDarkThemeEnabled = storedTheme === 'true'
      this.$vuetify.theme.dark = this.isDarkThemeEnabled
    }
    this.updateActiveFromRoute()
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.debouncedResize)
  },
  watch: {
    $route() {
      this.updateActiveFromRoute()
    },
  },
}
</script>

<style scoped>
.large-header {
  background-color: #DFCBA4;
  z-index: 1000;
  position: fixed;
  left: 16px;
  /* 确保与logo岛保持最小间距 */
  top: 154px;
  /* logo岛的top(64px) + height(70px) + 最小间距(20px) */
  height: auto;
  max-height: calc(100vh - 250px);
  /* 确保不会超出视口，并与logo岛保持距离 */
  width: 70px;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: visible;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.logo-btn {
  padding: 0 !important;
  top: -16px;
}

/* Logo岛设计 */
.logo-island {
  position: fixed;
  left: 16px;
  top: 64px;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: #DFCBA4;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.logo-island:hover {
  transform: scale(1.05);
}

.header-grid {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    'icons'
    'language';
  gap: 16px;
  padding: 0;
  width: 100%;
  height: 100%;
}

/* 图标区域 */
.icons-section {
  grid-area: icons;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  margin: 10px 0;
  padding: 10px 0;
}

/* 语言切换栏 */
.language-section {
  grid-area: language;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  width: 100%;
  padding: 0 5px;
  margin-bottom: 16px;
}

.language-toggle {
  min-width: 48px !important;
  width: 48px !important;
  height: 48px !important;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  overflow: hidden;
}

.language-toggle:hover {
  transform: scale(1.1);
  background-color: #FAF6F0;
}

.language-text {
  font-weight: bold;
  font-size: 0.9rem;
  text-transform: none;
  padding: 0;
}

.language-code {
  margin-left: 8px;
  font-size: 0.9rem;
  font-weight: bold;
}

/* 搜索对话框 */
.search-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.search-input-dialog {
  background-color: rgba(255, 255, 255, 1);
  border-radius: 999px;
  padding: 0 16px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .large-header {
    width: 60px;
    top: 144px;
    /* 调整后的间距计算：60px + 64px + 20px */
  }

  .logo-island {
    width: 60px;
    height: 60px;
  }

  .responsive-logo {
    padding: 8px;
  }

  .icons-section {
    gap: 16px;
  }
}

@media (max-height: 600px) {
  .large-header {
    top: 154px;
    /* 保持固定间距 */
    height: calc(100vh - 250px);
  }

  .icons-section {
    gap: 16px;
  }
}

.language-select {
  text-align: center;
  min-width: 60px !important;
  font-size: 0.8rem;
}

:global(body.phone-layout) .large-header,
:global(body.phone-layout) .logo-island {
  transform: translateX(-100px);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

:global(body.phone-layout) .large-header.menu-open,
:global(body.phone-layout) .logo-island.menu-open {
  transform: translateX(0);
  opacity: 1;
}

/* 按钮激活态样式 */
.active-btn {
  background-color: rgba(206, 184, 136, 0.7);
  border-radius: 12px;
  transform: scale(1.05);
}

/* 移除图标按钮文字 */
:deep(.icon-button-label) {
  display: none;
}

/* 为图标按钮添加悬停提示效果 */
.icon-btn-container {
  position: relative;
}

.icon-btn-container:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 85px;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 0.9rem;
  white-space: nowrap;
  z-index: 1002;
  opacity: 0;
  animation: fadeIn 0.3s forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
</style>
