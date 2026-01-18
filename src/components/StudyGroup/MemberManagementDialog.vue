<template>
  <v-dialog v-model="inner" max-width="720">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center">
        {{ $t('memberMgmt.title') }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>
      <v-card-text>
        <div class="mb-4 d-flex align-center">
          <v-text-field
            v-model="inviteInput"
            :label="$t('memberMgmt.inviteLabel')"
            density="compact"
            hide-details
            class="mr-2"
          />
          <v-btn color="primary" :loading="inviteBusy" @click="invite">{{ $t('memberMgmt.invite') }}</v-btn>
        </div>

        <div v-if="loading"><v-skeleton-loader type="list-item" v-for="n in 5" :key="n" /></div>
        <v-list v-else density="compact">
          <v-list-item v-for="m in members" :key="m.userId">
            <template #prepend>
              <v-avatar color="grey-lighten-2" size="28">{{ (m.displayName || m.userName || 'U')[0] }}</v-avatar>
            </template>
            <v-list-item-title>{{ m.displayName || m.userName || m.userId }}</v-list-item-title>
            <template #append>
              <v-btn size="small" variant="text" color="red" :loading="removeBusyId===m.userId" @click="remove(m)">{{ $t('memberMgmt.remove') }}</v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="close">{{ $t('close') }}</v-btn>
      </v-card-actions>
    </v-card>
    <v-snackbar v-model="snackOpen" timeout="2200">{{ snackText }}</v-snackbar>
  </v-dialog>
</template>

<script>
import { apiClient } from '@/api'
export default {
  name: 'MemberManagementDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    cohortId: { type: [String, Number], required: true },
  },
  data() {
    return {
      inner: this.modelValue,
      loading: false,
      members: [],
      inviteInput: '',
      inviteBusy: false,
      removeBusyId: null,
      snackOpen: false,
      snackText: '',
    }
  },
  watch: {
    modelValue(v) { this.inner = v; if (v) this.fetchMembers() },
    inner(v) { this.$emit('update:modelValue', v) },
  },
  methods: {
    close() { this.inner = false },
    toast(text) { this.snackText = text; this.snackOpen = true },
    async fetchMembers() {
      this.loading = true
      try {
        // Try canonical list endpoint
        let res = null
        try {
          res = await apiClient.get(`/cohorts/${this.cohortId}/members`)
        } catch (_) {
          res = await apiClient.get(`/Cohorts/${this.cohortId}/Members`)
        }
        this.members = Array.isArray(res?.data) ? res.data : []
      } catch (_) {
        this.members = []
      } finally {
        this.loading = false
      }
    },
    async invite() {
      const token = (this.inviteInput || '').trim()
      if (!token) return
      this.inviteBusy = true
      try {
        try {
          await apiClient.post(`/cohorts/${this.cohortId}/invite`, { user: token })
        } catch (_) {
          await apiClient.post(`/Cohorts/${this.cohortId}/Invite`, { user: token })
        }
        this.toast(this.$t('memberMgmt.inviteSuccess'))
        this.inviteInput = ''
        await this.fetchMembers()
      } catch (_) {
        this.toast(this.$t('memberMgmt.inviteFailed'))
      } finally {
        this.inviteBusy = false
      }
    },
    async remove(m) {
      this.removeBusyId = m.userId
      try {
        try {
          await apiClient.delete(`/cohorts/${this.cohortId}/members/${m.userId}`)
        } catch (_) {
          await apiClient.delete(`/Cohorts/${this.cohortId}/Members/${m.userId}`)
        }
        this.toast(this.$t('memberMgmt.removeSuccess'))
        await this.fetchMembers()
      } catch (_) {
        this.toast(this.$t('memberMgmt.removeFailed'))
      } finally {
        this.removeBusyId = null
      }
    },
  },
}
</script>

<style scoped>
</style>

