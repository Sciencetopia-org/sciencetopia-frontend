<template>
  <div class="large-header">
    <v-container class="header-grid" fluid>
      <!-- Icons (nav + actions) -->
      <div class="icons-section">
        <!-- 搜索图标 / Search -->
        <ReusableIconButton icon="mdi-magnify" :label="$t('header.search')" :iconSize="iconSize"
          @click="openSearchInput" />

        <!-- 趋势 / Trend -->
        <ReusableIconButton icon="mdi-rss" :label="$t('header.trend')" :iconSize="iconSize" @click="scrollToSection" />

        <!-- 学习小组 / StudyGroup -->
        <ReusableIconButton icon="mdi-account-group" :label="$t('header.studygroup')" :iconSize="iconSize"
          @click="RouteToStudyGroup" />

        <!-- 学习计划 / StudyPlan -->
        <ReusableIconButton icon="mdi-book-open-variant" :label="$t('header.studyplan')" :iconSize="iconSize"
          @click="handleStudyPlan" />

        <!-- 明/暗模式切换 -->
        <ReusableIconButton :icon="themeIcon" :label="themeLabel" :iconSize="iconSize" @click="toggleTheme" />

        <!-- 登录 / Login (handled by LogInPartial) -->
        <LogInPartial :is-small-screen="isSmallScreen" :icon-size="iconSize" />

        <!-- 消息 / Messages -->
        <MessageAlert :is-small-screen="isSmallScreen" :icon-size="iconSize" />
      </div>

      <!-- 语言切换栏 -->
      <div class="language-section">
        <div class="language-button-container">
          <v-btn class="language-toggle" variant="text" @click="toggleLanguage"
            :aria-label="$t('header.languageSwitch')">
            <v-icon size="24">mdi-translate</v-icon>
          </v-btn>
        </div>
      </div>
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
import MessageAlert from './MessageAlert.vue'
import LogInPartial from './LogInPartial.vue'
import ReusableIconButton from './ReusableIconButton.vue'
import { eventBus } from '@/eventBus'

export default {
  name: 'HeaderBar',
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
      languageOptions: [
        { title: 'English', value: 'en' },
        { title: 'Chinese', value: 'zh' },
      ],
      langTextWidth: 0,
    }
  },
  computed: {
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
      this.$router.push({ name: 'studyGroupList' })
    },
    handleStudyPlan() {
      if (!this.isAuthenticated) {
        alert('请先登录再查看学习计划')
      } else {
        this.$emit('showStudyPlanDialog', true)
      }
    },
    toggleLanguage() {
      const currentIndex = this.languageOptions.findIndex(
        (item) => item.value === this.$i18n.locale
      )
      const nextIndex = (currentIndex + 1) % this.languageOptions.length
      this.$i18n.locale = this.languageOptions[nextIndex].value
      this.$vuetify.locale.current = this.languageOptions[nextIndex].value
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
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.debouncedResize)
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
  overflow-y: auto;
  overflow-x: hidden;
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
  overflow-y: auto;
  margin: 10px 0;
  padding: 10px 0;
}

.icons-section::-webkit-scrollbar {
  width: 3px;
}

.icons-section::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.icons-section {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
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
  min-width: 40px !important;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  overflow: hidden;
}

.language-toggle:hover {
  transform: scale(1.1);
  background-color: rgba(255, 255, 255, 0.3);
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

/* 移动端显示的汉堡菜单按钮 */
.menu-toggle {
  display: none;
}

@media (max-width: 600px) {

  .large-header,
  .logo-island {
    transform: translateX(-100px);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .large-header.menu-open,
  .logo-island.menu-open {
    transform: translateX(0);
    opacity: 1;
  }

  .menu-toggle {
    display: block;
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 1001;
    background-color: rgba(232, 218, 189, 0.8);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
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
