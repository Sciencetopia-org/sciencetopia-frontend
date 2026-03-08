<template>
  <div class="join-group">
    <form @submit.prevent="joinGroup">
      <label>Group ID:</label>
      <input v-model="groupId" type="text" />
      <button type="submit" :disabled="loading">{{ loading ? 'Joining...' : 'Join Group' }}</button>
    </form>
  </div>
</template>

<script>
import { apiClient } from '@/api'

export default {
  data() {
    return {
      groupId: '',
      loading: false,
    }
  },
  methods: {
    async joinGroup() {
      if (!this.groupId) return
      this.loading = true
      try {
        await apiClient.post('/StudyGroup/ApplyToJoin', { studyGroupId: String(this.groupId).trim() })
        this.$toast?.success?.('Application submitted.')
      } catch (_) {
        this.$toast?.error?.(this.$t('operationfailed'))
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
