<template>
  <div
    class="icon-item message-alert-container"
    :class="{ 'message-ring--active': messagesActive }"
    role="button"
    tabindex="0"
    @keydown.enter.prevent="directMessages"
  >
    <!-- 根据登录状态动态显示悬停提示 -->
    <v-tooltip v-if="!isAuthenticated" :text="$t('header.pleaselogin') + $t('header.toseemessage')" location="right" open-delay="300">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" class="icon-btn" variant="text" @click.stop="directMessages">
          <v-icon :size="iconSize">mdi-bell</v-icon>
          <div v-if="messageCount > 0" class="alert-badge">
            {{ messageCount > 99 ? '99+' : messageCount }}
          </div>
          <div v-else-if="notificationCount > 0" class="alert-badge-dot"></div>
        </v-btn>
      </template>
    </v-tooltip>

    <!-- 登录状态下显示下拉菜单并添加悬停提示 -->
    <v-menu
      v-else
      v-model="menuOpen"
      open-on-hover
      location="right"
      offset="8"
      :disabled="menuHoverBlocked"
      :close-on-content-click="true"
      :open-delay="80"
      :close-delay="150"
    >
      <template v-slot:activator="{ props: menuProps }">
        <v-tooltip location="right" open-delay="300" :text="$t('header.messages')">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-btn v-bind="{ ...tooltipProps, ...menuProps }" class="icon-btn" variant="text" @click.stop="directMessages">
              <v-icon :size="iconSize">mdi-bell</v-icon>
              <div v-if="messageCount > 0" class="alert-badge">
                {{ messageCount > 99 ? '99+' : messageCount }}
              </div>
              <div v-else-if="notificationCount > 0" class="alert-badge-dot"></div>
            </v-btn>
          </template>
        </v-tooltip>
      </template>

      <!-- 下拉菜单: 仅当已登录(isAuthenticated)时才显示 -->
      <v-list class="header-list st-card" @mouseenter="onMenuMouseEnter" @mouseleave="onMenuMouseLeave">
        <v-list-item variant="plain" @click="directMessages">
          <v-list-item-title>{{
            $t('message.privatemessage')
            }}</v-list-item-title>
        </v-list-item>
        <v-divider color="text" style="margin-top: 5px; margin-bottom: 5px"></v-divider>
        <v-list-item variant="plain" @click="notifications">
          <v-list-item-title>{{
            $t('message.notification')
            }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- 移除文字说明部分 -->
    <LoginRequiredDialog v-model="loginRequiredDialog" :message="$t('loginRequired.messagesMessage')" />
  </div>
</template>
<script>
import { mapState } from 'vuex'
import LoginRequiredDialog from '@/components/ui/LoginRequiredDialog.vue'

export default {
  name: 'MessageAlert',
  components: {
    LoginRequiredDialog,
  },
  props: {
    isSmallScreen: {
      type: Boolean,
      default: null, // 父组件传值优先级更高
    },
    iconSize: {
      type: Number,
      default: 48, // 默认图标大小
    },
  },
  data() {
    return {
      isSmallScreenLocal: window.innerWidth <= 1200, // 初始判断屏幕大小
      menuOpen: false,
      menuHoverBlocked: false,
      loginRequiredDialog: false,
    }
  },
  computed: {
    ...mapState(['messageCount', 'notificationCount']),
    isAuthenticated() {
      return this.$store.state.isAuthenticated // 判断用户是否已登录
    },
    computedIsSmallScreen() {
      // 优先使用父组件传递的值，否则使用内部判断
      return this.isSmallScreen !== null
        ? this.isSmallScreen
        : this.isSmallScreenLocal
    },
    messagesActive() {
      const name = this.$route?.name
      return name === 'directMessages' || name === 'notifications'
    },
  },
  watch: {
    $route() {
      this.menuOpen = false
      this.menuHoverBlocked = true
      setTimeout(() => { this.menuHoverBlocked = false }, 500)
    }
  },
  methods: {
    login() {
      this.$router.push({ name: 'login' })
    },
    async directMessages() {
      const userId = await this.ensureUserId()
      if (!userId) return

      this.closeMenuForNavigation()
      this.$router.push({ name: 'directMessages', params: { userId } })
    },
    async notifications() {
      const userId = await this.ensureUserId()
      if (!userId) return

      this.closeMenuForNavigation()
      this.$router.push({ name: 'notifications', params: { userId } })
    },
    handleResize() {
      this.isSmallScreenLocal = window.innerWidth <= 1200
    },
    closeMenuForNavigation() {
      this.menuOpen = false
      this.menuHoverBlocked = true
      setTimeout(() => { this.menuHoverBlocked = false }, 500)
    },
    onMenuMouseEnter() { this.menuOpen = true },
    onMenuMouseLeave() { this.menuOpen = false },
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
        this.loginRequiredDialog = true
        return null
      }

      return userId
    },
  },
  mounted() {
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    // 移除事件监听器
    window.removeEventListener('resize', this.handleResize)
  },
}
</script>
<style scoped>
.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.icon-btn {
  width: 48px !important;
  height: 48px !important;
  min-width: 0 !important;
  border-radius: 50%;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  aspect-ratio: 1 / 1;
}

/* Ensure button scales when hovering container (including outer ring area) */
.icon-btn:hover { transform: scale(1.1); }
.message-alert-container:hover .icon-btn { transform: scale(1.1); }

.icon-btn:active {
  transform: scale(0.95);
}

/* Outer ring halo outside the button */
.message-alert-container {
  position: relative;
  /* Match ReusableIconButton outer ring diameter */
  --outer-ring-size: 48px;
}

.message-alert-container .icon-btn { z-index: 1; }

.message-alert-container::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--outer-ring-size);
  height: var(--outer-ring-size);
  transform: translate(-50%, -50%) scale(1);
  border-radius: 50%;
  background-color: transparent;
  opacity: 0;
  transition: background-color 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
  z-index: 0;
}

.message-alert-container:hover::before {
  background-color: #FAF6F0;
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.1);
}
.message-alert-container.message-ring--active::before { background-color: #F1E9D7; opacity: 1; }

.message-alert-container :deep(.v-btn__overlay),
.message-alert-container :deep(.v-btn__underlay) {
  background-color: transparent !important;
}

/* 选中高亮为浅色正圆 */
.icon-btn--active { background-color: transparent !important; transform: scale(0.95); }

.icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.alert-badge {
  position: absolute;
  top: 0px;
  right: 0px;
  background-color: #ff6666;
  color: white;
  border-radius: 50%;
  padding: 0.3em;
  font-size: 0.7em;
  min-width: 18px;
  min-height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-badge-dot {
  position: absolute;
  top: 0px;
  right: 0px;
  background-color: #ff6666;
  border-radius: 50%;
  width: 10px;
  height: 10px;
}

/* 中屏 */
@media (max-width: 1200px) {
  .icon-btn {
    width: 42px;
    height: 42px;
  }
  .message-alert-container { --outer-ring-size: 50px; }
}

/* 小屏 */
@media (max-width: 800px) {
  .icon-btn {
    width: 36px;
    height: 36px;
  }
  .message-alert-container { --outer-ring-size: 44px; }
}
</style>

