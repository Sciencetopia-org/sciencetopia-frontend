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
              <v-tooltip :text="$t('studygroup.promote')" location="bottom">
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

              <v-tooltip :text="$t('studygroup.demote')" location="bottom">
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
  components: { LoadingSpinner: require('../LoadingSpinner.vue').default },
  props: {
    groupId: String,
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
    async promoteToManager(memberId) {
      this.actioningId = memberId
      try {
        await apiClient.post(
          `/StudyGroupManage/PromoteToManager/${this.groupId}`,
          { memberId }
        )
        await this.fetchMembers()
      } finally {
        this.actioningId = null
      }
    },
    async demoteToMember(memberId) {
      this.actioningId = memberId
      try {
        await apiClient.post(`/StudyGroupManage/DemoteToMember/${this.groupId}`, {
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
        await apiClient.post(`/StudyGroupManage/RemoveMember/${this.groupId}`, {
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
        this.members = response.data
      } finally {
        this.loading = false
      }
    },
    inviteMember() {
      this.inviting = true
      setTimeout(() => { this.inviting = false }, 800)
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
