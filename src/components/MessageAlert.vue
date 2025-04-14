<template>
  <div
    class="icon-item"
    role="button"
    tabindex="0"
    @keydown.enter.prevent="directMessages"
  >
    <!-- 根据登录状态动态显示悬停提示 -->
    <v-tooltip
      v-if="!isAuthenticated"
      text="请先登录以查看信息"
      location="bottom"
      open-delay="300"
    >
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" class="icon-btn" variant="plain" disabled>
          <v-icon :size="iconSize">mdi-bell</v-icon>
          <div v-if="messageCount > 0" class="alert-badge">
            {{ messageCount > 99 ? '99+' : messageCount }}
          </div>
          <div v-else-if="notificationCount > 0" class="alert-badge-dot"></div>
        </v-btn>
      </template>
    </v-tooltip>

    <!-- 登录状态下显示下拉菜单 -->
    <v-menu v-else open-on-hover>
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" class="icon-btn" variant="plain">
          <v-icon :size="iconSize">mdi-bell</v-icon>
          <div v-if="messageCount > 0" class="alert-badge">
            {{ messageCount > 99 ? '99+' : messageCount }}
          </div>
          <div v-else-if="notificationCount > 0" class="alert-badge-dot"></div>
        </v-btn>
      </template>

      <!-- 下拉菜单: 仅当已登录(isAuthenticated)时才显示 -->
      <v-list class="header-list st-card">
        <v-list-item variant="plain" @click="directMessages">
          <v-list-item-title>{{
            $t('message.privatemessage')
          }}</v-list-item-title>
        </v-list-item>
        <v-divider
          color="text"
          style="margin-top: 5px; margin-bottom: 5px"
        ></v-divider>
        <v-list-item variant="plain" @click="notifications">
          <v-list-item-title>{{
            $t('message.notification')
          }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- 根据屏幕大小动态显示文字 -->
    <span v-if="!computedIsSmallScreen" class="icon-label">{{
      $t('header.messages')
    }}</span>
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
  /* 显示手型指针 */
  position: relative;
}

.icon-item:hover .icon-btn {
  transform: scale(1.05);
  background-color: rgba(255, 255, 255, 0.1);
}

.icon-btn {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  position: relative;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:disabled {
  cursor: inherit;
  /* 禁用按钮的手型指针，避免冲突 */
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

.icon-label {
  font-size: 14px;
  margin-top: 6px;
  text-align: center;
  white-space: nowrap;
}
</style>
