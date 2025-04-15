<template>
  <div class="icon-item" role="button" tabindex="0" @keydown.enter.prevent="directMessages">
    <!-- 根据登录状态动态显示悬停提示 -->
    <v-tooltip v-if="!isAuthenticated" :text="$t('header.toseemessage')" location="right" open-delay="300">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" class="icon-btn" variant="text">
          <v-icon :size="iconSize">mdi-bell</v-icon>
          <div v-if="messageCount > 0" class="alert-badge">
            {{ messageCount > 99 ? '99+' : messageCount }}
          </div>
          <div v-else-if="notificationCount > 0" class="alert-badge-dot"></div>
        </v-btn>
      </template>
    </v-tooltip>

    <!-- 登录状态下显示下拉菜单并添加悬停提示 -->
    <v-menu v-else open-on-hover>
      <template v-slot:activator="{ props: menuProps }">
        <v-tooltip location="right" open-delay="300" :text="$t('header.messages')">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-btn v-bind="{ ...tooltipProps, ...menuProps }" class="icon-btn" variant="text">
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
      <v-list class="header-list st-card">
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
  </div>
</template>
<script>
import { mapState } from 'vuex'

export default {
  name: 'MessageAlert',
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
  },
  methods: {
    login() {
      this.$router.push({ name: 'login' })
    },
    directMessages() {
      if (!this.isAuthenticated) {
        // 未登录 -> 提示或跳转登录
        alert('请先登录再查看消息列表')
      } else {
        const userId = this.$store.state.currentUserID
        this.$router.push({ name: 'directMessages', params: { userId } })
      }
    },
    notifications() {
      const userId = this.$store.state.currentUserID
      this.$router.push({ name: 'notifications', params: { userId } })
    },
    handleResize() {
      // 更新屏幕大小的状态
      this.isSmallScreenLocal = window.innerWidth <= 1200
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
  width: 48px;
  height: 48px;
  border-radius: 50%;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
}

.icon-btn:hover {
  transform: scale(1.1);
  background-color: rgba(255, 255, 255, 0.2);
}

.icon-btn:active {
  transform: scale(0.95);
}

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
}

/* 小屏 */
@media (max-width: 800px) {
  .icon-btn {
    width: 36px;
    height: 36px;
  }
}
</style>
