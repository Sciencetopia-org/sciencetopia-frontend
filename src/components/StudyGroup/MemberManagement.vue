<template>
  <v-card class="member-management">
    <v-card-title>{{ $t('memberMgmt.title') }}</v-card-title>
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
            <th>{{ $t('role') }}</th>
            <th class="actions-column">{{ $t('operation') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in members" :key="member.id">
            <td>
              <v-btn
                icon="dots-vertical"
                class="justify-center align-center default-avatar"
                size="40"
              >
                <v-avatar size="38">
                  <img :src="member.avatarUrl" :alt="$t('user.useravatar')" />
                </v-avatar>
              </v-btn>
            </td>
            <td>{{ member.userName }}</td>
            <td>{{ member.role }}</td>
            <td class="actions-column">
              <v-tooltip v-if="canPromote(member)" :text="$t('studygroup.promote')" location="bottom">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon
                    v-bind="props"
                    :disabled="actioningId===member.id"
                    @click="promoteToManager(member.id)"
                    >👨‍🎓</v-btn
                  >
                </template>
              </v-tooltip>

              <v-tooltip v-if="canDemote(member)" :text="$t('studygroup.demote')" location="bottom">
                <template v-slot:activator="{ props }">
                  <v-btn icon v-bind="props" :disabled="actioningId===member.id" @click="demoteToMember(member.id)"
                    >🧑</v-btn
                  >
                </template>
              </v-tooltip>

              <v-tooltip :text="$t('memberMgmt.remove')" location="bottom">
                <template v-slot:activator="{ props }">
                  <v-btn icon v-bind="props" :disabled="actioningId===member.id" @click="removeMember(member.id)"
                    >❎</v-btn
                  >
                </template>
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </v-simple-table>

      <v-card-actions>
        <v-btn color="primary" :disabled="inviting" :loading="inviting" @click="inviteMember">{{ $t('memberMgmt.invite') }}</v-btn>
      </v-card-actions>
      </template>
    </v-card-text>
  </v-card>
</template>

<script>
import { apiClient } from '@/api'

export default {
  components: { LoadingSpinner: require('@/components/ui/LoadingSpinner.vue').default },
  props: {
    groupId: [String, Number],
  },
  data() {
    return {
      members: [],
      loading: true,
      actioningId: null,
      inviting: false,
    }
  },
  async mounted() {
    await this.fetchMembers()
  },
  methods: {
    normalizeRole(value) {
      const v = String(value || '').toLowerCase()
      if (v === 'manager' || v === 'admin') return 'Admin'
      if (v === 'owner') return 'Owner'
      return 'Member'
    },
    canPromote(member) {
      return this.normalizeRole(member?.role) === 'Member'
    },
    canDemote(member) {
      return this.normalizeRole(member?.role) === 'Admin'
    },
    async promoteToManager(memberId) {
      this.actioningId = memberId
      try {
        await apiClient.post(`/StudyGroupManage/TransferManagerRole/${this.groupId}`, {
          newManagerId: memberId,
        })
        await this.fetchMembers()
      } finally {
        this.actioningId = null
      }
    },
    async demoteToMember(memberId) {
      this.actioningId = memberId
      try {
        await apiClient.post(`/StudyGroupManage/DeleteMember/${this.groupId}`, {
          memberId,
        })
        await apiClient.post(`/StudyGroupManage/InviteMember/${this.groupId}`, {
          memberId,
        })
        await this.fetchMembers()
      } finally {
        this.actioningId = null
      }
    },
    async removeMember(memberId) {
      this.actioningId = memberId
      try {
        await apiClient.post(`/StudyGroupManage/DeleteMember/${this.groupId}`, {
          memberId,
        })
        await this.fetchMembers()
      } finally {
        this.actioningId = null
      }
    },
    async fetchMembers() {
      this.loading = true
      try {
        const response = await apiClient.get(
          `/StudyGroup/GetStudyGroupMembers/${this.groupId}`
        )
        const list = Array.isArray(response?.data) ? response.data : []
        this.members = list.map((m) => ({
          id: m.id || m.userId,
          userName: m.userName || m.displayName || m.name || m.id,
          avatarUrl: m.avatarUrl,
          role: this.normalizeRole(m.role),
        }))
      } finally {
        this.loading = false
      }
    },
    async inviteMember() {
      const memberId = window.prompt(this.$t('memberMgmt.inviteLabel'))
      if (!memberId) return
      this.inviting = true
      try {
        await apiClient.post(`/StudyGroupManage/InviteMember/${this.groupId}`, { memberId: String(memberId).trim() })
        await this.fetchMembers()
      } finally {
        this.inviting = false
      }
    },
  },
}
</script>

<style scoped>
@import '../../assets/css/table.css';

.member-management {
  width: 100%;
  /* Ensure the card takes the full width of its container */
  max-width: 1200px;
  margin: auto;
  background-color: unset !important;
}
</style>

