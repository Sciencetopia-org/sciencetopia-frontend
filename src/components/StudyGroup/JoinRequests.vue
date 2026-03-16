<template>
  <v-card class="join-requests">
    <v-card-title>{{ $t('studygroup.joinrequest') }}</v-card-title>
    <v-card-text>
      <div v-if="loading">
        <LoadingSpinner />
      </div>
      <template v-else>
      <v-simple-table class="full-width-table">
        <thead>
          <tr>
            <th>{{ $t('avatar') }}</th>
            <th>{{ $t('username') }}</th>
            <th>{{ $t('studygroup.requestdate') }}</th>
            <th class="actions-column">{{ $t('operation') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in requests" :key="request.userId || request.UserId">
            <td>
              <v-btn
                icon="dots-vertical"
                class="justify-center align-center default-avatar"
                size="40"
                @click="navigateToProfile(request.userId || request.UserId)"
              >
                <v-avatar size="38">
                  <img :src="request.avatarUrl" :alt="$t('user.useravatar')" />
                </v-avatar>
              </v-btn>
            </td>
            <td>{{ request.name }}</td>
            <td>{{ request.appliedOn }}</td>
            <td class="actions-column">
              <v-btn
                variant="text"
                color="primary"
                :disabled="actioningId===(request.userId || request.UserId)"
                :loading="actioningId===(request.userId || request.UserId) && actioningType==='approve'"
                @click="approveRequest(request.userId || request.UserId)"
                >{{ $t('approve') }}</v-btn
              >
              <v-btn
                variant="text"
                color="secondary"
                :disabled="actioningId===(request.userId || request.UserId)"
                :loading="actioningId===(request.userId || request.UserId) && actioningType==='reject'"
                @click="rejectRequest(request.userId || request.UserId)"
                >{{ $t('reject') }}</v-btn
              >
            </td>
          </tr>
        </tbody>
      </v-simple-table>
      </template>
    </v-card-text>
  </v-card>
</template>

<script>
import { apiClient } from '@/api'
import { mapActions } from 'vuex'

const joinRequestCache = new Map()

export default {
  components: { LoadingSpinner: require('@/components/ui/LoadingSpinner.vue').default },
  props: {
    groupId: [String, Number],
  },
  data() {
    return {
      requests: [],
      loading: true,
      actioningId: null,
      actioningType: null,
    }
  },
  watch: {
    groupId: {
      immediate: true,
      async handler() {
        await this.fetchRequests()
      },
    },
  },
  methods: {
    ...mapActions(['goToProfile']), // Map the Vuex action

    async approveRequest(userId) {
      if (!userId) return
      this.actioningId = userId; this.actioningType = 'approve'
      try {
        await apiClient.post('/StudyGroup/UpdateApplicationStatus', {
          userId,
          studyGroupId: this.groupId,
          status: 'Approved',
        })
        joinRequestCache.delete(String(this.groupId || ''))
        await this.fetchRequests()
      } finally { this.actioningId = null; this.actioningType = null }
    },
    async rejectRequest(userId) {
      if (!userId) return
      this.actioningId = userId; this.actioningType = 'reject'
      try {
        await apiClient.post('/StudyGroup/UpdateApplicationStatus', {
          userId,
          studyGroupId: this.groupId,
          status: 'Rejected',
        })
        joinRequestCache.delete(String(this.groupId || ''))
        await this.fetchRequests()
      } finally { this.actioningId = null; this.actioningType = null }
    },
    async fetchRequests() {
      const cacheKey = String(this.groupId || '')
      if (joinRequestCache.has(cacheKey)) {
        this.requests = joinRequestCache.get(cacheKey) || []
        this.loading = false
        return
      }

      this.loading = true
      try {
        const response = await apiClient.get(
          `/StudyGroup/GetJoinRequests/${this.groupId}`
        )
        this.requests = Array.isArray(response?.data) ? response.data : []
        joinRequestCache.set(cacheKey, this.requests)
      } finally { this.loading = false }
    },
    async navigateToProfile(userId) {
      this.goToProfile({ userId, router: this.$router }) // Dispatch the action
    },
  },
}
</script>

<style scoped>
@import '../../assets/css/table.css';

.join-requests {
  width: 100%;
  max-width: 1200px;
  margin: auto;
  background-color: unset !important;
}
</style>

