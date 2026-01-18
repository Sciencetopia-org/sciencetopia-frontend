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
          <tr v-for="request in requests" :key="request.id">
            <td>
              <v-btn
                icon="dots-vertical"
                class="justify-center align-center default-avatar"
                size="40"
                @click="navigateToProfile(request.userId)"
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
                :disabled="actioningId===request.id"
                :loading="actioningId===request.id && actioningType==='approve'"
                @click="approveRequest(request.id)"
                >{{ $t('approve') }}</v-btn
              >
              <v-btn
                variant="text"
                color="secondary"
                :disabled="actioningId===request.id"
                :loading="actioningId===request.id && actioningType==='reject'"
                @click="rejectRequest(request.id)"
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

export default {
  components: { LoadingSpinner: require('@/components/ui/LoadingSpinner.vue').default },
  props: {
    groupId: String,
  },
  data() {
    return {
      requests: [],
      loading: true,
      actioningId: null,
      actioningType: null,
    }
  },
  async mounted() {
    await this.fetchRequests()
  },
  methods: {
    ...mapActions(['goToProfile']), // Map the Vuex action

    async approveRequest(requestId) {
      this.actioningId = requestId; this.actioningType = 'approve'
      try {
        await apiClient.post(
          `/StudyGroupManage/ApproveJoinRequest/${this.groupId}`,
          { requestId }
        )
        await this.fetchRequests()
      } finally { this.actioningId = null; this.actioningType = null }
    },
    async rejectRequest(requestId) {
      this.actioningId = requestId; this.actioningType = 'reject'
      try {
        await apiClient.post(
          `/StudyGroupManage/RejectJoinRequest/${this.groupId}`,
          { requestId }
        )
        await this.fetchRequests()
      } finally { this.actioningId = null; this.actioningType = null }
    },
    async fetchRequests() {
      this.loading = true
      try {
        const response = await apiClient.get(
          `/StudyGroup/GetJoinRequests/${this.groupId}`
        )
        this.requests = response.data
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

