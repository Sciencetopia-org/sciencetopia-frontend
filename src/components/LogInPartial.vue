<template>
  <div class="avatar-container icon-item">
    <!-- 已登录状态 -->
    <div
      v-if="isAuthenticated"
      @mouseleave="hovering = false"
      class="icon-item"
    >
      <v-tooltip
        :text="$store.state.userInfo.userName"
        location="bottom"
        open-delay="300"
        :disabled="!isSmallScreen"
      >
        <template v-slot:activator="slotProps">
          <div
            v-bind="slotProps.props"
            @mouseenter="hovering = true"
            @mouseleave="hovering = false"
            class="avatar-hover-container"
          >
            <!-- 用户头像按钮 -->
            <v-btn
              variant="plain"
              class="icon-btn default-avatar avatar-hover"
              :style="{ width: iconSize + 'px', height: iconSize + 'px' }"
              @click="personalcenter"
            >
              <v-avatar :size="iconSize">
                <img :src="avatarUrl" :alt="$t('user.useravatar')" />
              </v-avatar>
            </v-btn>

            <!-- 悬浮弹出卡片 -->
            <v-card
              v-if="hovering"
              class="user-info-card animated-card st-card"
              elevation="3"
              width="250"
            >
              <v-card-title @click="personalcenter">
                <v-row>
                  <v-col cols="auto">
                    <v-btn
                      icon
                      class="default-avatar"
                      :style="{
                        width: iconSize * 1.3 + 'px',
                        height: iconSize * 1.3 + 'px',
                      }"
                    >
                      <v-avatar :size="iconSize * 1.25">
                        <img :src="avatarUrl" :alt="$t('user.useravatar')" />
                      </v-avatar>
                    </v-btn>
                  </v-col>
                  <v-col cols="auto" class="d-flex justify-center align-center">
                    <v-list-item-title class="user-name">
                      {{ $store.state.userInfo.userName }}
                    </v-list-item-title>
                  </v-col>
                </v-row>
              </v-card-title>
              <v-divider
                color="text"
                opacity="0.1"
                :thickness="2"
                style="margin: 5px 0"
              />
              <v-list class="list-on-card" dense>
                <v-list-item @click="personalcenter">
                  <v-list-item-title>
                    <v-icon>mdi-account</v-icon>{{ $t('user.personalcenter') }}
                  </v-list-item-title>
                </v-list-item>

                <v-divider color="text" opacity="0.1" style="margin: 5px 0" />
                <v-list-item @click="accountcenter">
                  <v-list-item-title>
                    <v-icon>mdi-cog</v-icon>{{ $t('user.accountsetting') }}
                  </v-list-item-title>
                </v-list-item>

                <v-divider color="text" opacity="0.1" style="margin: 5px 0" />
                <v-list-item @click="logout">
                  <v-list-item-title>
                    <v-icon>mdi-logout</v-icon>{{ $t('user.logout') }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </div>
        </template>
      </v-tooltip>

      <!-- 大屏下在图标旁边显示用户名（与其他带文字说明的图标对齐） -->
      <span v-if="!isSmallScreen" class="icon-label">
        {{ $store.state.userInfo.userName }}
      </span>
    </div>

    <!-- 未登录状态 -->
    <div v-else class="icon-item">
      <v-tooltip
        :text="$t('header.login') + ' / ' + $t('header.register')"
        location="bottom"
        open-delay="300"
        :disabled="!isSmallScreen"
      >
        <template v-slot:activator="slotProps">
          <!-- 默认头像按钮，点击跳转到登录 -->
          <v-btn
            v-bind="slotProps.props"
            variant="plain"
            class="icon-btn default-avatar"
            :style="{ width: iconSize + 'px', height: iconSize + 'px' }"
            @click="login"
          >
            <v-avatar :size="iconSize">
              <img
                src="../assets/images/avatar.svg"
                alt="avatar"
                style="width: 100%; height: 100%; border-radius: 50%"
              />
            </v-avatar>
          </v-btn>
        </template>
      </v-tooltip>

      <!-- 大屏下显示“登录”和“注册”按钮 -->
      <div v-if="!isSmallScreen" class="auth-buttons">
        <v-btn
          variant="flat"
          style="background-color: #de2910; color: black"
          class="auth-btn"
          @click="login"
        >
          {{ $t('header.login') }}
        </v-btn>
        <v-btn
          variant="flat"
          style="background-color: black; color: white"
          class="auth-btn"
          @click="register"
        >
          {{ $t('header.register') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { apiClient } from '@/api'

export default {
  name: 'LogInPartial',
  props: {
    scrolledPastHeader: Boolean,
    isSmallScreen: Boolean,
    iconSize: {
      type: Number,
      default: 32,
    },
  },
  data() {
    return {
      hovering: false,
    }
  },
  computed: {
    isAuthenticated() {
      return this.$store.state.isAuthenticated
    },
    avatarUrl() {
      return this.$store.state.avatarUrl
    },
  },
  methods: {
    login() {
      this.$router.push({ name: 'login' })
    },
    register() {
      this.$router.push({ name: 'register' })
    },
    personalcenter() {
      const userId = this.$store.state.currentUserID
      this.$router.push({ name: 'personalcenter', params: { userId } })
    },
    accountcenter() {
      const userId = this.$store.state.currentUserID
      this.$router.push({ name: 'accountcenter', params: { userId } })
    },
    async logout() {
      try {
        await apiClient.post('/users/Account/Logout')
        await this.$store.dispatch('checkAuthenticationStatus')
        this.$router.push('/')
      } catch (error) {
        console.error(this.$t('user.erroroccur'), error)
      }
    },
  },
  mounted() {
    this.$store.dispatch('checkAuthenticationStatus')
  },
}
</script>

<style scoped>
/* 与其他图标统一外层布局：flex水平对齐，icon-item 保证居中 */
.avatar-container {
  display: flex;
  align-items: center;
  gap: 16px;
  /* 保持与其他图标相同的左右间距 */
}

/* 用于统一整体样式，跟 icons-section 内其他 icon-item 保持一致 */
.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 统一头像按钮大小，并确保在鼠标悬浮时有类似放大效果 */
.icon-btn {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  transform: scale(1.05);
  background-color: rgba(255, 255, 255, 0.1);
}

/* 图标旁边的文字，用于已登录时大屏显示用户名 */
.icon-label {
  font-size: 14px;
  margin-top: 6px;
  text-align: center;
  white-space: nowrap;
}

/* 悬浮弹出卡片样式 */
.avatar-hover-container {
  position: relative;
  display: inline-block;
}

.avatar-hover {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.user-info-card {
  position: absolute !important;
  top: -20px !important;
  left: -160px !important;
  z-index: 1000 !important;
}

.avatar-hover {
  opacity: 1;
  transform: scale(1);
}

.avatar-hover-container:hover .avatar-hover {
  opacity: 0;
  transform: scale(0.9);
}

.avatar-hover-container:hover .user-info-card {
  opacity: 1;
  transform: scale(1);
}

.user-name {
  font-weight: bold;
  font-size: 16px;
}

/* 动画效果 */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }

  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

.animated-card {
  animation-duration: 0.3s;
  animation-fill-mode: forwards;
}

.avatar-hover-container:hover .animated-card {
  animation-name: fadeInScale;
}

.avatar-hover-container:not(:hover) .animated-card {
  animation-name: fadeOutScale;
}

/* 新增样式 */

/* 大屏下的“登录”和“注册”按钮容器 */
.auth-buttons {
  display: flex;
  justify-content: center;
  /* 居中对齐 */
  align-items: center;
  padding: auto;
  gap: 10px;
  /* 调整按钮之间的间距 */
  width: 100%;
  /* 使容器占满父容器的宽度 */
}

/* “登录”和“注册”按钮的统一样式 */
.auth-btn {
  /* 移除最小宽度和固定高度 */
  min-width: unset;
  height: unset;
  /* 保持按钮文字的原始大小写和字体大小 */
  text-transform: none;
  font-size: 14px;
  /* 调整内边距以减小按钮尺寸 */
  padding: 0 8px;
  border-radius: 4px;
}

/* 确保按钮在小屏下不显示 */
@media (max-width: 600px) {
  .auth-buttons {
    display: none;
  }
}
</style>
