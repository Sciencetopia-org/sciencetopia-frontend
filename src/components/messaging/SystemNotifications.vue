<template>
  <v-container
    class="notification-title-container d-flex align-center justify-center"
  >
    <v-card-title>{{ $t('message.notification') }}</v-card-title>
  </v-container>
  <v-card class="system-notifications">
    <v-card-text>
      <div v-if="loading" class="d-flex justify-center align-center" style="height: 60vh">
        <LoadingSpinner />
      </div>
      <v-accordion v-else>
        <v-accordion-item
          v-for="(groupedNotifications, type) in groupedNotificationsByType"
          :key="type"
        >
          <template v-slot:title>
            {{ getTypeLabel(type) }}
          </template>
          <v-list class="notification-list">
            <v-list-item
              v-for="notification in groupedNotifications"
              :key="notification.id"
            >
              <v-list-item-content>
                <v-list-item-title class="notification-bubble">{{
                  notification.content
                }}</v-list-item-title>
                <v-list-item-subtitle>{{
                  formatDate(notification.createdAt)
                }}</v-list-item-subtitle>
                <v-btn
                  v-if="notification.data"
                  @click="viewDetails(notification.data)"
                  text
                  small
                  >{{ $t('showdetail') }}</v-btn
                >
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-accordion-item>
      </v-accordion>
    </v-card-text>
  </v-card>
</template>

<script>
import { apiClient } from '@/api'
import { DateTime } from 'luxon'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

export default {
  components: { LoadingSpinner },
  data() {
    return {
      notifications: [],
      userId: this.$store.state.currentUserID, // Assuming the user ID is stored in Vuex state
      loading: true,
    }
  },
  computed: {
    groupedNotificationsByType() {
      return this.notifications.reduce((acc, notification) => {
        if (!acc[notification.type]) {
          acc[notification.type] = []
        }
        acc[notification.type].push(notification)
        return acc
      }, {})
    },
  },
  async mounted() {
    await this.fetchNotifications()
    this.setupSignalRListener()
  },
  methods: {
    async fetchNotifications() {
      try {
        const response = await apiClient.get(
          `/Notification/GetNotificationsForUser/${this.userId}`
        )
        this.notifications = response.data
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally { this.loading = false }
    },
    setupSignalRListener() {
      const connection = this.$root.$signalRConnection
      if (connection) {
        connection.on('ReceiveNotification', (notification) => {
          this.notifications.push(notification)
        })
      } else {
        console.error('SignalR connection is not defined')
      }
    },
    formatDate(date) {
      return DateTime.fromISO(date).toLocaleString(DateTime.DATETIME_MED)
    },
    getTypeLabel(type) {
      const key = `notifications.types.${type}`
      const translated = this.$t(key)
      return translated !== key ? translated : this.$t('notifications.unknownType')
    },
    viewDetails(data) {
      // Route to the appropriate page based on the notification data (url)
      this.$router.push(data)
    },
  },
}
</script>

<style scoped>
.system-notifications {
  margin-left: 0.6vw;
  margin-top: 0.6vh;
  height: 81vh;
  width: 100%;
  background-color: #f4eee1;
  border-bottom-right-radius: 4vw !important;
}

.notification-title-container {
  height: 5vh;
  padding: 0;
  margin-top: 0vh;
  background-color: #dfcba4;
  color: #03381c;
  border-bottom: 3px solid #666666;
  border-top-right-radius: 8vw !important;
  margin-left: 0.6vw;
}

.v-list-item-title {
  font-weight: bold;
  font-size: 18px;
}

.v-list-item-subtitle {
  font-size: 0.8em;
  color: gray;
}

.v-accordion-item {
  margin-bottom: 10px;
}

.notification-list {
  height: 100%;
  overflow-y: auto;
  background-color: unset;
}

.notification-bubble {
  padding: 8px 12px;
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
  background-color: #dfcba4;
  width: 100%;
  word-break: break-word;
}
</style>

