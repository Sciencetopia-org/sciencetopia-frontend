<template>
  <v-bottom-navigation
    class="mobile-bottom-nav"
    :model-value="active"
    grow
    mandatory
    elevation="8"
    height="64"
  >
    <v-btn value="plans" @click="goPlans">
      <v-icon>mdi-book-open-variant</v-icon>
      <span>{{ $t('header.studyplan') }}</span>
    </v-btn>
    <v-btn value="graph" @click="goHome">
      <v-icon>mdi-graph-outline</v-icon>
      <span>{{ $t('knowledgeGraph.knowledgeGraph') }}</span>
    </v-btn>
    <v-btn value="messages" @click="goMessages">
      <v-badge
        :content="messageBadge"
        :model-value="messageBadge > 0"
        color="red"
        floating
      >
        <v-icon>mdi-message-outline</v-icon>
      </v-badge>
      <span>{{ $t('message.message') || $t('message.privatemessage') }}</span>
    </v-btn>
    <v-btn value="profile" @click="goProfile">
      <v-icon>mdi-account-circle-outline</v-icon>
      <span>{{ $t('usercenter.profile') || $t('usercenter.my') }}</span>
    </v-btn>
  </v-bottom-navigation>
  <LoginRequiredDialog v-model="loginRequiredDialog" :message="loginRequiredMessage" />
</template>

<script>
import LoginRequiredDialog from '@/components/ui/LoginRequiredDialog.vue'

export default {
  name: 'MobileBottomNav',
  components: {
    LoginRequiredDialog,
  },
  data() {
    return {
      loginRequiredDialog: false,
      loginRequiredMessage: '',
    }
  },
  computed: {
    userId() {
      return this.$store.state.currentUserID || this.$store.state.userInfo?.id
    },
    messageBadge() {
      const direct = Number(this.$store.state.messageCount || 0)
      const notifications = Number(this.$store.state.notificationCount || 0)
      return Math.min(99, direct + notifications)
    },
    active() {
      const name = this.$route.name
      if (name === 'HomePage') return 'graph'
      if (name === 'StudyPlanWorkspace' || name === 'PlanPage' || name === 'StudyPlanDetail') return 'plans'
      if (name === 'messagecenter' || name === 'directMessages' || name === 'notifications') return 'messages'
      if (name === 'personalcenter' || name === 'accountcenter') return 'profile'
      return 'graph'
    },
  },
  methods: {
    async ensureUserId() {
      if (this.userId) return this.userId
      try {
        await this.$store.dispatch('checkAuthenticationStatus')
      } catch (err) {
        console.warn('Failed to refresh authentication status before navigation', err)
      }
      return this.userId
    },
    showLoginRequired(message) {
      this.loginRequiredMessage = message || this.$t('loginRequired.defaultMessage')
      this.loginRequiredDialog = true
    },
    goHome() {
      this.$router.push({ name: 'HomePage' })
    },
    async goPlans() {
      const userId = await this.ensureUserId()
      if (!userId) {
        this.showLoginRequired(this.$t('loginRequired.studyPlanMessage'))
        return
      }
      this.$router.push({ name: 'StudyPlanWorkspace', params: { userId } })
    },
    async goMessages() {
      const userId = await this.ensureUserId()
      if (!userId) {
        this.showLoginRequired(this.$t('loginRequired.messagesMessage'))
        return
      }
      this.$router.push({ name: 'directMessages', params: { userId } })
    },
    async goProfile() {
      const userId = await this.ensureUserId()
      if (!userId) {
        this.showLoginRequired(this.$t('loginRequired.profileMessage'))
        return
      }
      this.$router.push({ name: 'personalcenter', params: { userId } })
    },
  },
}
</script>

<style scoped>
:global(.mobile-bottom-nav) {
  display: none !important;
  position: fixed !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 1200 !important;
  width: 100% !important;
  max-width: 100vw !important;
  height: calc(64px + env(safe-area-inset-bottom)) !important;
  padding-bottom: env(safe-area-inset-bottom);
  background: #fbf8f2 !important;
  border-top: 1px solid rgba(48, 78, 117, 0.12);
}

@media (max-width: 600px) {
  :global(.mobile-bottom-nav) {
    display: flex !important;
  }
}

:global(.mobile-bottom-nav .v-bottom-navigation__content) {
  width: 100%;
}

:global(.mobile-bottom-nav .v-btn) {
  min-width: 0;
}

:global(.mobile-bottom-nav .v-btn__content) {
  gap: 2px;
}

:global(.mobile-bottom-nav span) {
  max-width: 68px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  letter-spacing: 0;
}
</style>
