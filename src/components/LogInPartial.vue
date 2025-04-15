<template>
  <div class="avatar-container icon-item">
    <!-- 已登录状态 -->
    <div v-if="isAuthenticated" @mouseleave="hovering = false" class="icon-item">
      <v-tooltip :text="$store.state.userInfo.userName" location="right" open-delay="300">
        <template v-slot:activator="slotProps">
          <div v-bind="slotProps.props" @mouseenter="hovering = true" @mouseleave="hovering = false"
            class="avatar-hover-container">
            <!-- 用户头像按钮 -->
            <v-btn variant="text" class="icon-btn default-avatar avatar-hover"
              :style="{ width: iconSize + 'px', height: iconSize + 'px' }" @click="personalcenter">
              <v-avatar :size="iconSize">
                <img :src="avatarUrl" :alt="$t('user.useravatar')" />
              </v-avatar>
            </v-btn>

            <!-- 悬浮弹出卡片 -->
            <v-card v-if="hovering" class="user-info-card animated-card st-card" elevation="3" width="250">
              <v-card-title @click="personalcenter">
                <v-row>
                  <v-col cols="auto">
                    <v-btn icon class="default-avatar" :style="{
                      width: iconSize * 1.3 + 'px',
                      height: iconSize * 1.3 + 'px',
                    }">
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
              <v-divider color="text" opacity="0.1" :thickness="2" style="margin: 5px 0" />
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
    </div>

    <!-- 未登录状态 -->
    <div v-else class="icon-item">
      <v-tooltip :text="$t('header.login')" location="right" open-delay="300">
        <template v-slot:activator="slotProps">
          <!-- 默认头像按钮，点击跳转到登录 -->
          <v-btn v-bind="slotProps.props" variant="text" class="icon-btn default-avatar avatar-container-fix"
            @click="login">
            <v-avatar :size="iconSize" class="avatar-circle">
              <img src="../assets/images/avatar.svg" alt="avatar" class="avatar-image" />
            </v-avatar>
          </v-btn>
        </template>
      </v-tooltip>
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
  border-radius: 50%;
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
  left: 60px !important;
  z-index: 1000 !important;
}

.avatar-hover {
  opacity: 1;
  transform: scale(1);
}

.avatar-hover-container:hover .avatar-hover {
  opacity: 0.9;
  transform: scale(0.95);
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

/* 确保头像为正圆形 */
.avatar-circle {
  border-radius: 50% !important;
  overflow: hidden !important;
  aspect-ratio: 1/1 !important;
  width: v-bind(iconSize + 'px') !important;
  height: v-bind(iconSize + 'px') !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.avatar-image {
  width: 100% !important;
  height: 100% !important;
  border-radius: 50% !important;
  object-fit: cover !important;
  aspect-ratio: 1/1 !important;
}

/* 修复Vuetify的overlay和underlay元素，确保它们也是圆形的 */
:deep(.v-avatar__underlay),
:deep(.v-btn__overlay),
:deep(.v-btn__underlay) {
  border-radius: 50% !important;
  width: 100% !important;
  height: 100% !important;
}

:deep(.v-btn__content) {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 专门修复未登录状态下头像椭圆形问题 */
.avatar-container-fix {
  width: v-bind(iconSize + 'px') !important;
  height: v-bind(iconSize + 'px') !important;
  border-radius: 50% !important;
  min-width: v-bind(iconSize + 'px') !important;
  max-width: v-bind(iconSize + 'px') !important;
  min-height: v-bind(iconSize + 'px') !important;
  max-height: v-bind(iconSize + 'px') !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

.avatar-container-fix :deep(.v-btn__content) {
  padding: 0 !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 50% !important;
}

/* 确保SVG图像本身是正方形 */
.avatar-image {
  min-width: 100% !important;
  min-height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  object-fit: contain !important;
  box-sizing: border-box !important;
}
</style>
