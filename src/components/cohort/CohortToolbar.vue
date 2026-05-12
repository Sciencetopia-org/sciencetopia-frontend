<template>
  <v-card flat class="cohort-toolbar py-2 px-3">
    <div class="d-flex align-center">
      <div class="mr-3 d-flex align-center">
        <h2 class="text-h6 mr-2" :title="plan?.title">{{ plan?.title || $t('unknown') }}</h2>
        <v-chip v-if="versionText" size="x-small" label color="primary" class="mr-2">{{ versionText }}</v-chip>
      </div>
      <v-chip v-if="activeCohort" class="mr-2" size="small" label>
        {{ $t('cohortToolbar.yourCohort') }}：{{ activeCohort.title || $t('cohort.untitledClass') }}
      </v-chip>
      <v-spacer />

      <!-- Group-scoped only shows link to group management -->
      <v-btn
        v-if="isGroupScoped"
        size="small"
        variant="text"
        color="primary"
        @click="goToGroup"
      >
        {{ $t('cohortToolbar.gotoGroupManage') }}
      </v-btn>

      <!-- Public/Solo actions, visibility controlled by effective perms -->
      <div v-else class="d-flex align-center">
        <v-tooltip v-if="!perms.CanInviteToCohort" :text="$t('cohortToolbar.noPermInvite')" location="bottom">
          <template #activator="{ props }">
            <div v-bind="props">
              <v-btn size="small" variant="text" :disabled="!perms.CanInviteToCohort">{{ $t('cohortToolbar.inviteRemove') }}</v-btn>
            </div>
          </template>
        </v-tooltip>
        <v-btn v-else size="small" variant="text" @click="manageMembers">{{ $t('cohortToolbar.inviteRemove') }}</v-btn>

        <v-tooltip v-if="!canPin" :text="$t('cohortToolbar.noPermPin')" location="bottom">
          <template #activator="{ props }">
            <div v-bind="props">
              <v-btn size="small" variant="text" :disabled="!canPin">{{ $t('cohortToolbar.pinVersion') }}</v-btn>
            </div>
          </template>
        </v-tooltip>
        <v-btn v-else size="small" variant="text" @click="pinVersion">{{ $t('cohortToolbar.pinVersion') }}</v-btn>

        <v-tooltip v-if="!perms.CanEditPlan" :text="$t('cohortToolbar.noPermEdit')" location="bottom">
          <template #activator="{ props }">
            <div v-bind="props">
              <v-btn size="small" variant="text" :disabled="!perms.CanEditPlan" @click="editSchedule">{{ $t('cohortToolbar.editSchedule') }}</v-btn>
            </div>
          </template>
        </v-tooltip>
        <v-btn v-else size="small" variant="text" @click="editSchedule">{{ $t('cohortToolbar.editSchedule') }}</v-btn>
      </div>
    </div>
    <v-snackbar v-model="snackOpen" timeout="2200">{{ snackText }}</v-snackbar>
  </v-card>
</template>

<script>
import { fetchEffectivePermissions } from '@/services/effective-permissions'
import { apiClient } from '@/api'

export default {
  name: 'CohortToolbar',
  props: {
    planId: { type: [String, Number], required: true },
  },
  data() {
    return {
      perms: {
        CanEditPlan: false,
        CanPublishVersion: false,
        CanManageCohort: false,
        CanInviteToCohort: false,
        CanUpgradeCohortVersion: false,
        CanViewPlan: true,
      },
      loadingPerms: false,
      snackOpen: false,
      snackText: '',
    }
  },
  computed: {
    plan() {
      return this.$store.getters.planById(this.planId)
    },
    enrollment() {
      return this.$store.getters.enrollmentOfPlan(this.planId)
    },
    activeCohort() {
      const id = this.enrollment?.activeCohortId
      return id ? this.$store.getters.cohortById(id) : null
    },
    isGroupScoped() {
      return !!this.activeCohort?.studyGroupId
    },
    versionText() {
      const pinned = this.activeCohort?.pinnedVersionNumber
      const current = this.plan?.currentVersionNumber
      if (typeof pinned !== 'number' && typeof current !== 'number') return ''
      if (typeof pinned === 'number' && typeof current === 'number' && pinned !== current) {
        return this.$t('cohortToolbar.versionHasUpdate', { pinned: `v${pinned}`, current: `v${current}` })
      }
      const display = typeof pinned === 'number' ? pinned : current
      return this.$t('cohortToolbar.versionCurrent', { current: `v${display}` })
    },
    canPin() {
      // Either publish or upgrade permission can allow pin operations depending on backend rules
      return this.perms.CanPublishVersion || this.perms.CanUpgradeCohortVersion || this.perms.CanManageCohort
    },
  },
  watch: {
    planId: {
      immediate: true,
      async handler() {
        await this.loadPerms()
      },
    },
    'activeCohort.id': {
      immediate: true,
      async handler() {
        await this.loadPerms()
      },
    },
  },
  methods: {
    async loadPerms() {
      if (!this.planId) return
      this.loadingPerms = true
      try {
        const data = await fetchEffectivePermissions({ planId: this.planId, cohortId: this.activeCohort?.id })
        if (data) this.perms = { ...this.perms, ...data }
      } catch (e) {
        // keep defaults
      } finally {
        this.loadingPerms = false
      }
    },
    goToGroup() {
      const gid = this.activeCohort?.studyGroupId
      if (!gid) return
      this.$router.push({ name: 'studyGroupPage', params: { groupId: gid } })
    },
    manageMembers() {
      this.$emit('manage-members', { planId: this.planId, cohortId: this.activeCohort?.id })
    },
    async pinVersion() {
      const currentVersionNumber = this.plan?.currentVersionNumber
      if (!this.activeCohort || typeof currentVersionNumber !== 'number') return
      const cohortId = this.activeCohort.id
      const groupId = this.activeCohort.studyGroupId
      try {
        if (groupId) {
          await apiClient.patch(`/Groups/${groupId}/Cohorts/${cohortId}`, { pinnedVersionNumber: currentVersionNumber })
        } else {
          await apiClient.put(`/Cohorts/${cohortId}`, { pinnedVersionNumber: currentVersionNumber })
        }
        this.$store.commit('UPSERT_COHORT', { id: cohortId, pinnedVersionNumber: currentVersionNumber })
        this.toast(this.$t('cohortToolbar.pinSuccess'))
      } catch (e) {
        this.toast(this.$t('cohortToolbar.pinFailed'))
      }
    },
    editSchedule() {
      // Placeholder; navigate or open schedule editor
      this.$emit('edit-schedule', { planId: this.planId })
    },
    toast(text) { this.snackText = text; this.snackOpen = true },
  },
}
</script>

<style scoped>
.cohort-toolbar {
  background: transparent;
}
</style>
