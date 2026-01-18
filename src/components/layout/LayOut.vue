<template>
  <div class="layout-wrapper">
    <!-- 顶部搜索条（可选） -->
    <SearchBar v-if="searchBarVisible" />

    <!-- 主体左右布局：左侧“占位”，右侧主内容 -->
    <div class="body-wrapper">
      <!-- 仅占位，不渲染内容。真正的 HeaderBar 是固定定位，独立于文档流。 -->
      <div class="sidebar-slot"></div>

      <!-- 固定定位的最左侧全局导航 -->
      <HeaderBar @showStudyPlanDialog="handleDialogClick" />

      <!-- 移动端汉堡按钮 -->
      <div v-if="isSmallScreen" class="menu-toggle" @click="toggleMobileMenu">
        <v-icon>{{ mobileMenuOpen ? 'mdi-close' : 'mdi-menu' }}</v-icon>
      </div>

      <!-- 右侧主内容：自动占据除侧栏之外的剩余宽度 -->
      <main class="main-content" :class="{ 'mobile-content': isSmallScreen }">
        <slot></slot>
      </main>
    </div>

    <!-- 学习计划弹窗 -->
    <v-dialog
      v-model="dialog"
      persistent
      :max-width="$vuetify.display.smAndDown ? '100%' : '800px'"
      :fullscreen="$vuetify.display.smAndDown"
    >
      <v-card>
        <v-card-title>{{ $t('header.studyplan') }}</v-card-title>
        <v-card-text>
          <LearningPlanner
            ref="learningPlanner"
            @update:showStudyPlan="handleShowStudyPlanUpdate"
            @background="handleBackground"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="red darken-1"
            text
            v-if="showStudyPlan"
            @click="triggerSavePlan"
          >
            {{ $t('save') }}{{ $t('wordbreaker') }}{{ $t('header.studyplan') }}
          </v-btn>
          <v-btn color="blue darken-1" text @click="closeDialog">
            {{ $t('close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="backgroundSnackbar"
      :timeout="-1"
      @click="onBackgroundSnackbarClick"
    >
      <div class="d-flex align-center">
        <v-progress-circular
          v-if="backgroundLoading"
          indeterminate
          color="white"
          class="mr-2"
        />
        <span>{{ backgroundMessage }}</span>
      </div>
    </v-snackbar>

    <!-- 底部 -->
    <div class="footer-container">
      <transition name="footer-transition">
        <v-footer app v-if="!showFinalFooter" class="dynamic-footer">
          <FooterBar />
        </v-footer>
      </transition>

      <!-- <DefaultFooterBar /> -->
    </div>

    <ScrollToTopButton />
  </div>
</template>

<script>
import LearningPlanner from '@/components/study-plan/LearningPlanner.vue'
import HeaderBar from './HeaderBar.vue'
import SearchBar from '@/components/search/SearchBar.vue'
import FooterBar from './FooterBar.vue'
// import DefaultFooterBar from './DefaultFooterBar.vue'
import ScrollToTopButton from '@/components/ui/ScrollToTopButton.vue'
import { eventBus } from '@/eventBus'
import { apiClient } from '@/api'

export default {
  name: 'LayOut',
  components: {
    LearningPlanner,
    HeaderBar,
    FooterBar,
    SearchBar,
    // DefaultFooterBar,
    ScrollToTopButton,
  },
  data() {
    return {
      isLoading: false,
      dialog: false,
      showStudyPlan: false,
      showFinalFooter: false,
      isSmallScreen:
        typeof window !== 'undefined' ? window.innerWidth <= 600 : false,
      mobileMenuOpen: false,
      searchBarVisible: false,
      backgroundSnackbar: false,
      backgroundMessage: '',
      backgroundLoading: false,
      backgroundSuccess: false,
      generatedPlanId: null,
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()

    eventBus.on('show-search-bar', this.showSearchBar)
    eventBus.on('hide-search-bar', this.hideSearchBar)
    eventBus.on('background-plan', this.handleBackground)

    document.body.classList.add('sidebar-layout')
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    eventBus.off('show-search-bar', this.showSearchBar)
    eventBus.off('hide-search-bar', this.hideSearchBar)
    eventBus.off('background-plan', this.handleBackground)
    document.body.classList.remove('sidebar-layout')
  },
  methods: {
    handleResize() {
      this.isSmallScreen = window.innerWidth <= 600

      const header = document.querySelector('.large-header')
      if (header) {
        if (this.isSmallScreen && this.mobileMenuOpen)
          header.classList.add('menu-open')
        else header.classList.remove('menu-open')
      }
    },
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
      const header = document.querySelector('.large-header')
      const logo = document.querySelector('.logo-island')
      if (header) header.classList.toggle('menu-open')
      if (logo) logo.classList.toggle('menu-open')
    },
    triggerSavePlan() {
      this.$refs.learningPlanner?.savePlan?.()
    },
    closeDialog() {
      this.showStudyPlan = false
      this.dialog = false
    },
    handleShowStudyPlanUpdate(v) {
      this.showStudyPlan = v
    },
    handleDialogClick() {
      if (this.$store.state.backgroundGenerating) {
        alert(this.$t('studyplan.ai.generatingTryLater'))
        return
      }
      this.dialog = true
    },
    showSearchBar() {
      this.searchBarVisible = true
    },
    hideSearchBar() {
      this.searchBarVisible = false
    },
    handleBackground(promise) {
      this.dialog = false
      this.showStudyPlan = false
      this.backgroundMessage = this.$t('studyplan.ai.generatingBackground')
      this.backgroundSnackbar = true
      this.backgroundLoading = true
      this.backgroundSuccess = false
      this.generatedPlanId = null
      this.$store.commit('SET_BACKGROUND_GENERATING', true)
      promise
        .then(async (res) => {
          try {
            const studyPlan = res.data?.StudyPlan
            if (studyPlan) {
              const saveRes = await apiClient.post('/StudyPlan/SaveStudyPlan', {
                studyPlan,
              })
              this.generatedPlanId =
                saveRes.data?.id || saveRes.data?.studyPlan?.id || null
            }
            this.backgroundMessage = this.$t('studyplan.ai.generated')
            this.backgroundSuccess = true
          } catch (e) {
            console.error('Error saving background study plan:', e)
            this.backgroundMessage = this.$t('studyplan.ai.generateFailed')
            this.backgroundSuccess = false
          }
        })
        .catch(() => {
          this.backgroundMessage = this.$t('studyplan.ai.generateFailed')
          this.backgroundSuccess = false
        })
        .finally(() => {
          this.backgroundLoading = false
          this.$store.commit('SET_BACKGROUND_GENERATING', false)
        })
    },
    onBackgroundSnackbarClick() {
      if (this.backgroundLoading) return
      this.backgroundSnackbar = false
      if (this.backgroundSuccess) {
        const route = {
          name: 'StudyPlanWorkspace',
          params: { userId: this.$store.state.currentUserID },
        }
        if (this.generatedPlanId) {
          route.query = { planId: this.generatedPlanId }
        }
        this.$router.push(route)
      }
    },
  },
}
</script>

<style scoped>
@import '../../assets/css/layout.css';
@import '../../assets/css/header.css';
@import '../../assets/css/switches.css';
@import '../../assets/css/footer.css';
@import '../../assets/css/form.css';

/* 
  在组件根元素上定义 CSS 变量（会向下继承），避免 :root + scoped 带来的变量失效问题。
  和你的 HeaderBar.vue 保持一致：
  .large-header { left: 16px; width: 70px; }
  额外留一个安全间距 gap = 16px。
*/
.layout-wrapper {
  --sidebar-left: 16px; /* = .large-header 的 left */
  --sidebar-width: 70px; /* = .large-header 的 width */
  --sidebar-gap: 16px; /* 主内容与侧栏额外间距 */
  --sidebar-reserved: calc(
    var(--sidebar-left, 16px) + var(--sidebar-width, 70px)
  );
}

/* 外层上下结构 */
.layout-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 主体左右并排（左侧占位 + 右侧主内容） */
.body-wrapper {
  flex: 1 1 auto;
  display: flex;
  flex-direction: row;
  min-height: 0;
}

/* 左侧占位：把主内容“推”到 HeaderBar 的右边 */
.sidebar-slot {
  flex: 0 0 var(--sidebar-reserved, 86px);
  width: var(--sidebar-reserved, 86px);
  max-width: var(--sidebar-reserved, 86px);
}

/* 主内容占据剩余空间 */
.main-content {
  flex: 1 1 auto;
  min-width: 0; /* 防止溢出 */
  box-sizing: border-box;
  padding: var(--content-padding, 16px);
  /* background: white; */
}

/* 移动端：主内容全宽，不再预留侧栏 */
@media (max-width: 600px) {
  .body-wrapper {
    flex-direction: column;
  }
  .sidebar-slot {
    display: none;
  }
  .main-content {
    --content-padding: 8px;
    width: 100%;
  }
}

/* 移动端汉堡按钮（保留你的样式） */
.menu-toggle {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1001;
  background-color: rgba(232, 218, 189, 0.8);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: none;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}
@media (max-width: 600px) {
  .menu-toggle {
    display: flex;
  }
}

/* 底部动画与配色（保持原样） */
.footer-transition-enter-active {
  animation: footer-bounce-in 0.4s ease-out;
}
.footer-transition-leave-active {
  animation: footer-bounce-out 0.4s ease-out;
}

.dynamic-footer {
  height: var(--footer-vh, 6vh);
  width: calc(100% - 32px) !important;
  background-color: rgba(232, 218, 189);
  margin-left: 16px;
  margin-right: 16px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  /* backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); */
}

@keyframes footer-bounce-in {
  0% {
    transform: translateY(120%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes footer-bounce-out {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(120%);
    opacity: 0;
  }
}
</style>
