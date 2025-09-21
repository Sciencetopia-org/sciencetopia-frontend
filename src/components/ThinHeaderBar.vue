<template>
  <div class="large-header">
    <v-container class="header-grid" fluid>
      <!-- Logo -->
      <div class="logo-section">
        <v-btn variant="plain" class="logo-btn" @click.prevent="backToHomePage">
          <img :src="isSmallScreen ? smallLogo : largeLogo" alt="Logo" class="responsive-logo" />
        </v-btn>
      </div>

      <!-- Search -->
      <div class="search-section">
        <v-text-field v-model.trim="searchQuery" :placeholder="$t('searchbar.iwanttolearn')" variant="plain"
          density="comfortable" hide-details clearable @keydown.enter.prevent="globalSearch"
          append-inner-icon="mdi-magnify" @click:append-inner="globalSearch" class="search-input" />
      </div>

      <!-- Icons (nav + actions) -->
      <div class="icons-section">
        <ReusableIconButton v-for="(item, index) in navItems" :key="index" :icon="item.icon" :label="item.label"
          :iconSize="iconSize" @click="item.action" />

        <ReusableIconButton :icon="themeIcon" :label="themeLabel" :iconSize="iconSize" @click="toggleTheme" />

        <LogInPartial :is-small-screen="isSmallScreen" :icon-size="iconSize" />
        <MessageAlert :is-small-screen="isSmallScreen" :icon-size="iconSize" />
      </div>

      <!-- 语言切换栏 -->
      <div class="language-section">
        <v-select v-model="currentLocale" :items="languageOptions" density="comfortable" hide-details variant="plain"
          class="language-select" @update:model-value="handleLanguageChange" :style="computeLangWidthStyle" />
      </div>
    </v-container>
  </div>
</template>

<script>
import { debounce } from 'lodash-es'
import MessageAlert from './MessageAlert.vue'
import LogInPartial from './LogInPartial.vue'
import ReusableIconButton from './ReusableIconButton.vue'

export default {
  name: 'ThinHeaderBar',

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
      currentLocale: this.$i18n.locale,
      langTextWidth: 0,
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

    navItems() {
      return [
        {
          icon: 'mdi-rss',
          label: this.$t('header.trend'),
          action: this.scrollToSection,
        },
        {
          icon: 'mdi-account-group',
          label: this.$t('header.studygroup'),
          action: this.RouteToStudyGroup,
        },
        {
          icon: 'mdi-book-open-variant',
          label: this.$t('header.studyplan'),
          action: this.handleStudyPlan,
        },
      ]
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
  },

  methods: {
    handleResize() {
      this.isSmallScreen = window.innerWidth <= 1200
    },

    toggleTheme() {
      this.isDarkThemeEnabled = !this.isDarkThemeEnabled
      // Vuetify 主题切换
      this.$vuetify.theme.dark = this.isDarkThemeEnabled
      // 持久化主题选择
      localStorage.setItem('isDarkThemeEnabled', this.isDarkThemeEnabled)
    },

    backToHomePage() {
      this.$router.push({ name: 'HomePage' })
    },

    scrollToSection() {
      this.$router.push({ name: 'allFeeds' })
    },

    RouteToStudyGroup() {
      this.$router.push({ name: 'studyGroupList' })
    },

    async globalSearch() {
      const query = this.searchQuery.trim()
      if (!query) {
        this.$refs.searchInput?.focus()
        return
      }
      try {
        const path = this.$router.resolve({
          name: 'searchList',
          query: { q: query },
        }).href
        window.open(path, '_blank')
      } catch (error) {
        console.error('Search error:', error)
      }
    },

    handleStudyPlan() {
      if (!this.isAuthenticated) {
        this.alertMessage = this.$t('header.pleaseLoginToViewStudyPlan')
        return
      }
      this.$router.push({ name: 'StudyPlanWorkspace' })
    },

    handleLanguageChange(val) {
      this.currentLocale = val
      this.$i18n.locale = val
      this.$vuetify.locale.current = val
      try { localStorage.setItem('locale', val) } catch (_) {}
      // Notify app parts (e.g., KnowledgeGraph) to refresh with new lang
      try { window.dispatchEvent(new CustomEvent('app:lang-changed', { detail: val })) } catch (_) {}
      this.$nextTick(() => {
        this.measureLangTextWidth()
      })
    },

    measureLangTextWidth() {
      const tempSpan = document.createElement('span')
      const selectedItem = this.languageOptions.find(
        (item) => item.value === this.currentLocale
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
  background-color: #e8dabd;
  /* 移除模糊效果和透明度 */
  transition: all 0.3s ease;
  z-index: 1000;
  padding: 16px 0;
  width: 100%;
  position: relative;
  min-height: 80px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.header-grid {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  grid-template-areas: 'logo search icons language';
  align-items: center;
  column-gap: 24px;
  padding: 0 24px;
  position: relative;
  width: 100%;
  overflow: hidden;
  /* Fix overflow issues */
}

/* Logo区域 */
.logo-section {
  grid-area: logo;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.logo-btn {
  height: 100%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.responsive-logo {
  display: block;
  transition: all 0.3s ease;
  height: 64px;
  width: auto;
  object-fit: contain;
  max-height: 100%;
}

/* 搜索区域 */
.search-section {
  grid-area: search;
  max-width: 600px;
  width: 100%;
  display: flex;
  align-items: center;
  position: relative;
}

.search-input {
  background-color: rgba(255, 255, 255, 1);
  border: none;
  border-radius: 999px;
  padding-left: 16px;
  padding-right: 48px;
  box-shadow: 0 0 0 0 transparent;
  position: relative;
  height: 48px;
}

.search-input .v-input__slot {
  border: none !important;
  box-shadow: none !important;
  height: 100%;
  display: flex;
  align-items: center;
}

.search-input .v-field__append-inner {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.search-input .v-field__append-inner i.v-icon {
  font-size: 1.25rem;
}

/* 图标区域 */
.icons-section {
  grid-area: icons;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 16px;
  overflow-x: auto;
}

.icons-section::-webkit-scrollbar {
  display: none;
}

.icons-section {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 语言切换栏 */
.language-section {
  grid-area: language;
  display: flex;
  align-items: center;
  margin-left: 16px;
}

/* 响应式调整 */
@media (max-width: 1600px) {
  .header-grid {
    grid-template-columns: auto 1fr auto auto;
  }
}

@media (max-width: 1200px) {
  .header-grid {
    grid-template-columns: auto 1fr auto;
    grid-template-areas:
      'logo icons language'
      'search search search';
    row-gap: 12px;
  }

  .search-section {
    margin: 0 auto;
    width: 100%;
  }

  .icons-section {
    flex-wrap: nowrap;
    gap: 12px;
    justify-content: flex-start;
  }

  .language-section {
    margin-left: 24px;
  }

  .logo-section {
    margin-top: 14px;
  }
}

@media (max-width: 800px) {
  .header-grid {
    grid-template-columns: auto;
    grid-template-areas:
      'logo'
      'search'
      'icons'
      'language';
    row-gap: 8px;
  }

  .large-header {
    padding: 10px 16px;
  }

  .responsive-logo {
    height: 40px;
  }

  .search-section {
    margin: 10px 5px 20px 5px;
    min-width: 100%;
  }

  .icons-section {
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  .language-section {
    justify-content: center;
    margin-left: 0;
  }
}

.language-select {
  text-align: center;
}

.nav-section,
.actions-section {
  display: flex;
  align-items: center;
  margin-top: 5px;
  margin-bottom: 5px;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.logo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

.responsive-logo {
  display: block;
  transition: all 0.3s ease;
  height: 64px;
  width: auto;
  object-fit: contain;
  max-height: 100%;
}
</style>
