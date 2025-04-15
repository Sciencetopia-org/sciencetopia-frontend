<template>
  <div class="layout-wrapper">
    <HeaderBar @showStudyPlanDialog="handleDialogClick" />

    <!-- 移动端汉堡菜单按钮 -->
    <div v-if="isSmallScreen" class="menu-toggle" @click="toggleMobileMenu">
      <v-icon>{{ mobileMenuOpen ? 'mdi-close' : 'mdi-menu' }}</v-icon>
    </div>

    <v-dialog v-model="dialog" persistent :max-width="$vuetify.display.smAndDown ? '100%' : '800px'"
      :fullscreen="$vuetify.display.smAndDown">
      <v-card>
        <v-card-title>{{ $t('header.studyplan') }}</v-card-title>
        <v-card-text>
          <LearningPlanner ref="learningPlanner" @update:showStudyPlan="handleShowStudyPlanUpdate" />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red darken-1" text v-if="showStudyPlan" @click="triggerSavePlan">
            {{ $t('save') }}{{ $t('wordbreaker') }}{{ $t('header.studyplan') }}
          </v-btn>
          <v-btn color="blue darken-1" text @click="closeDialog">{{
            $t('close')
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <main class="main-content" :class="{ 'mobile-content': isSmallScreen }">
      <slot></slot>
    </main>

    <div class="footer-container">
      <transition name="footer-transition" :style="{ height: $vuetify.display.smAndDown ? '8vh' : '6vh' }">
        <v-footer app v-if="!showFinalFooter" class="dynamic-footer">
          <FooterBar />
        </v-footer>
      </transition>

      <DefaultFooterBar />
    </div>

    <ScrollToTopButton />
  </div>
</template>

<script>
import LearningPlanner from './LearningPlanner.vue'
import HeaderBar from './HeaderBar.vue'
import FooterBar from './FooterBar.vue'
import DefaultFooterBar from './DefaultFooterBar.vue'
import ScrollToTopButton from './ScrollToTopButton.vue'

export default {
  name: 'LayOut',
  components: {
    LearningPlanner,
    HeaderBar,
    FooterBar,
    DefaultFooterBar,
    ScrollToTopButton,
  },
  data() {
    return {
      isLoading: false,
      dialog: false,
      showStudyPlan: false,
      showFinalFooter: false,
      isSmallScreen: window.innerWidth <= 600,
      mobileMenuOpen: false,
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()

    // 添加侧边栏状态到body类
    document.body.classList.add('sidebar-layout')
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)

    // 移除侧边栏状态
    document.body.classList.remove('sidebar-layout')
  },
  methods: {
    handleResize() {
      this.isSmallScreen = window.innerWidth <= 600

      // 更新HeaderBar状态
      const header = document.querySelector('.large-header')
      if (header) {
        if (this.isSmallScreen && this.mobileMenuOpen) {
          header.classList.add('menu-open')
        } else if (this.isSmallScreen && !this.mobileMenuOpen) {
          header.classList.remove('menu-open')
        } else {
          header.classList.remove('menu-open')
        }
      }
    },
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
      const header = document.querySelector('.large-header')
      const logo = document.querySelector('.logo-island')

      if (header) {
        header.classList.toggle('menu-open')
      }

      if (logo) {
        logo.classList.toggle('menu-open')
      }
    },
    triggerSavePlan() {
      this.$refs.learningPlanner.savePlan()
    },
    closeDialog() {
      this.showStudyPlan = false
      this.dialog = false
    },
    handleShowStudyPlanUpdate(value) {
      this.showStudyPlan = value
    },
    handleDialogClick() {
      this.dialog = true
      console.log('Dialog clicked')
    },
  },
}
</script>

<style scoped>
@import '../assets/css/layout.css';
@import '../assets/css/header.css';
@import '../assets/css/switches.css';
@import '../assets/css/footer.css';
@import '../assets/css/form.css';

.layout-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 0;
  /* 移除左侧边距，让内容完全全宽显示 */
  padding: var(--content-padding, 16px);
  transition: margin-left 0.3s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background-color: white;
  background-image: none;
}

.mobile-content {
  margin-left: 0;
  padding-top: 60px;
  /* 为移动设备上的汉堡菜单腾出空间 */
}

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
  .main-content {
    margin-left: 0;
    --content-padding: 8px;
  }

  .menu-toggle {
    display: flex;
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 1001;
    background-color: rgba(232, 218, 189, 0.8);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    cursor: pointer;
  }
}

.header-container {
  background-color: #e8dabd;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.planner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.planner-card {
  max-width: 1600px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.header-button {
  font-family: 'Noto Sans SC', sans-serif;
  font-weight: 500;
}

body.modal-open {
  overflow: hidden;
}

body.modal-open .main-content {
  filter: blur(5px);
}

.dot-col {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-left: 30px;
  padding-right: 0px;
}

.dot {
  display: inline-block;
  text-align: center;
}

.footer-transition-enter-active {
  animation: footer-bounce-in 0.4s ease-out;
}

.footer-transition-leave-active {
  animation: footer-bounce-out 0.4s ease-out;
}

.dynamic-footer {
  background-color: rgba(232, 218, 189, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

@media (max-width: 600px) {
  .main-content {
    --content-padding: 8px;
    margin-left: 0;
  }

  .dynamic-footer {
    padding: 8px;
  }
}

@media (min-width: 601px) and (max-width: 960px) {
  .main-content {
    --content-padding: 16px;
  }
}

@media (min-width: 961px) {
  .dot-col .dot {
    font-size: 12px;
  }

  .header-bottom {
    padding-top: 30px;
  }

  .search-container {
    padding: 0px;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .search-btn {
    font-size: 12px;
    padding: 0px;
  }

  .search-form input {
    border: 0px;
    margin: 0px;
    padding-left: 0px;
  }
}

@keyframes footer-bounce-in {
  0% {
    transform: translateY(120%);
    opacity: 0%;
  }

  100% {
    transform: translateY(0);
    opacity: 100%;
  }
}

@keyframes footer-bounce-out {
  0% {
    transform: translateY(0);
    opacity: 100%;
  }

  100% {
    transform: translateY(120%);
    opacity: 0%;
  }
}
</style>
