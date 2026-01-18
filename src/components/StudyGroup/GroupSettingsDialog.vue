<template>
  <template v-if="inline">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ isManager ? $t('groupSettings.titleManager') : $t('groupSettings.titleMember') }}</span>
        <v-btn v-if="!inline" icon="mdi-close" variant="text" @click="close" />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <div v-if="loading"><LoadingSpinner /></div>
        <template v-else>
          <v-alert v-if="error" type="error" class="mb-3">{{ error }}</v-alert>

          <!-- Manager settings -->
          <div v-if="isManager">
            <h3 class="text-subtitle-1 mb-2">{{ $t('groupSettings.profile') }}</h3>
            <v-text-field v-model="form.profile.name" :label="$t('groupSettings.name')" density="comfortable" class="mb-2" />
            <v-textarea v-model="form.profile.bio" :label="$t('groupSettings.bio')" rows="2" auto-grow class="mb-2" />

            <h3 class="text-subtitle-1 mt-6 mb-2">{{ $t('groupSettings.sharedPlans') }}</h3>
            <v-table density="comfortable" class="mb-2">
              <thead>
                <tr>
                  <th class="text-left">{{ $t('groupSettings.plan') }}</th>
                  <th class="text-left">{{ $t('groupSettings.permission') }}</th>
                  <th class="text-left">{{ $t('groupSettings.autoEnroll') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in form.sharedPlans" :key="p.id">
                  <td>{{ p.title }}</td>
                  <td>
                    <v-select v-model="p.permission" :items="permOptions" density="compact" hide-details style="max-width: 140px" />
                  </td>
                  <td>
                    <v-switch v-model="p.autoEnroll" density="compact" hide-details inset />
                  </td>
                </tr>
              </tbody>
            </v-table>

            <h3 class="text-subtitle-1 mt-6 mb-2">{{ $t('groupSettings.groupCohorts') }}</h3>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th class="text-left">Cohort</th>
                  <th class="text-left">{{ $t('groupSettings.plan') }}</th>
                  <th class="text-left">{{ $t('groupSettings.enrollMode') }}</th>
                  <th class="text-left">{{ $t('groupSettings.pinnedVersion') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in form.cohorts" :key="c.id">
                  <td>{{ c.title }}</td>
                  <td>{{ c.planTitle }}</td>
                  <td>
                    <v-select v-model="c.enrollMode" :items="enrollOptions" density="compact" hide-details style="max-width: 120px" />
                  </td>
                  <td>
                    <v-chip size="x-small" label v-if="c.pinnedVersionNumber">v{{ c.pinnedVersionNumber }}</v-chip>
                    <span v-else class="text-caption">{{ $t('groupSettings.unpinned') }}</span>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <v-divider class="my-6" />
            <h3 class="text-subtitle-1 mb-2">{{ $t('operation') }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-3">
              {{ $t('studygroup.groupDissolveMessage') }}
            </p>
            <v-btn class="dissolve-button" @click="promptDissolveGroup">
              {{ $t('studygroup.disolve') }}
            </v-btn>

            <v-dialog v-model="dissolveDialog" max-width="600px">
              <v-card>
                <v-card-title class="headline" style="color: red">
                  <v-icon left color="red">mdi-alert-circle</v-icon>
                  {{ $t('operation') }}
                </v-card-title>
                <v-card-text>
                  <p>{{ $t('studygroup.groupDissolveMessage') }}</p>
                  <v-spacer style="height: 20px"></v-spacer>
                  <p>{{ $t('studygroup.confirmGroupName') }}</p>
                  <v-spacer style="height: 10px"></v-spacer>
                  <v-text-field
                    v-model="enteredGroupName"
                    :label="$t('studygroup.groupname')"
                    variant="outlined"
                    required
                    color="red"
                  ></v-text-field>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="red darken-1" text @click="confirmDissolveGroup">
                    {{ $t('confirm') }}
                  </v-btn>
                  <v-btn color="grey darken-1" text @click="cancelDissolveGroup">
                    {{ $t('cancel') }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </div>

          <!-- Member settings -->
          <div v-else>
            <h3 class="text-subtitle-1 mb-2">{{ $t('groupSettings.notificationPrefs') }}</h3>
            <v-switch v-model="form.notifications.planUpdates" :label="$t('groupSettings.planUpdates')" hide-details density="comfortable" inset />
            <v-switch v-model="form.notifications.mentions" :label="$t('groupSettings.mentions')" hide-details density="comfortable" inset />
            <v-switch v-model="form.notifications.rankings" :label="$t('groupSettings.rankings')" hide-details density="comfortable" inset />

            <h3 class="text-subtitle-1 mt-6 mb-2">{{ $t('groupSettings.learningVisibility') }}</h3>
            <v-switch v-model="form.privacy.shareMetrics" :label="$t('groupSettings.shareMetricsWithGroup')" hide-details density="comfortable" inset />
            <v-switch v-model="form.privacy.showOnLeaderboard" :label="$t('groupSettings.showOnLeaderboard')" hide-details density="comfortable" inset />

            <h3 class="text-subtitle-1 mt-6 mb-2">{{ $t('groupSettings.myPlans') }}</h3>
            <v-list density="compact">
              <v-list-item v-for="sp in form.myPlans" :key="sp.planId">
                <v-list-item-title>{{ sp.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ $t('groupSettings.currentCohort') }}{{ $t(':') }}{{ sp.cohortTitle || $t('groupSettings.notJoined') }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </template>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn v-if="!inline" variant="text" @click="close">{{ $t('close') }}</v-btn>
        <v-btn color="primary" :disabled="loading" @click="save">{{ $t('save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </template>
  <v-dialog v-else v-model="internalOpen" max-width="820" persistent>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ isManager ? $t('groupSettings.titleManager') : $t('groupSettings.titleMember') }}</span>
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <div v-if="loading"><v-skeleton-loader type="list-item" v-for="n in 4" :key="n" /></div>
        <template v-else>
          <v-alert v-if="error" type="error" class="mb-3">{{ $t(error) }}</v-alert>

          <!-- Manager settings -->
          <div v-if="isManager">
            <h3 class="text-subtitle-1 mb-2">{{ $t('groupSettings.profile') }}</h3>
            <v-text-field v-model="form.profile.name" :label="$t('groupSettings.name')" density="comfortable" class="mb-2" />
            <v-textarea v-model="form.profile.bio" :label="$t('groupSettings.bio')" rows="2" auto-grow class="mb-2" />

            <h3 class="text-subtitle-1 mt-6 mb-2">{{ $t('groupSettings.sharedPlans') }}</h3>
            <v-table density="comfortable" class="mb-2">
              <thead>
                <tr>
                  <th class="text-left">{{ $t('groupSettings.plan') }}</th>
                  <th class="text-left">{{ $t('groupSettings.permission') }}</th>
                  <th class="text-left">{{ $t('groupSettings.autoEnroll') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in form.sharedPlans" :key="p.id">
                  <td>{{ p.title }}</td>
                  <td>
                    <v-select v-model="p.permission" :items="permOptions" density="compact" hide-details style="max-width: 140px" />
                  </td>
                  <td>
                    <v-switch v-model="p.autoEnroll" density="compact" hide-details inset />
                  </td>
                </tr>
              </tbody>
            </v-table>

            <h3 class="text-subtitle-1 mt-6 mb-2">{{ $t('groupSettings.groupCohorts') }}</h3>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th class="text-left">Cohort</th>
                  <th class="text-left">{{ $t('groupSettings.plan') }}</th>
                  <th class="text-left">{{ $t('groupSettings.enrollMode') }}</th>
                  <th class="text-left">{{ $t('groupSettings.pinnedVersion') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in form.cohorts" :key="c.id">
                  <td>{{ c.title }}</td>
                  <td>{{ c.planTitle }}</td>
                  <td>
                    <v-select v-model="c.enrollMode" :items="enrollOptions" density="compact" hide-details style="max-width: 120px" />
                  </td>
                  <td>
                    <v-chip size="x-small" label v-if="c.pinnedVersionNumber">v{{ c.pinnedVersionNumber }}</v-chip>
                    <span v-else class="text-caption">{{ $t('groupSettings.unpinned') }}</span>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <v-divider class="my-6" />
            <h3 class="text-subtitle-1 mb-2">{{ $t('operation') }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-3">
              {{ $t('studygroup.groupDissolveMessage') }}
            </p>
            <v-btn class="dissolve-button" @click="promptDissolveGroup">
              {{ $t('studygroup.disolve') }}
            </v-btn>

            <v-dialog v-model="dissolveDialog" max-width="600px">
              <v-card>
                <v-card-title class="headline" style="color: red">
                  <v-icon left color="red">mdi-alert-circle</v-icon>
                  {{ $t('operation') }}
                </v-card-title>
                <v-card-text>
                  <p>{{ $t('studygroup.groupDissolveMessage') }}</p>
                  <v-spacer style="height: 20px"></v-spacer>
                  <p>{{ $t('studygroup.confirmGroupName') }}</p>
                  <v-spacer style="height: 10px"></v-spacer>
                  <v-text-field
                    v-model="enteredGroupName"
                    :label="$t('studygroup.groupname')"
                    variant="outlined"
                    required
                    color="red"
                  ></v-text-field>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="red darken-1" text @click="confirmDissolveGroup">
                    {{ $t('confirm') }}
                  </v-btn>
                  <v-btn color="grey darken-1" text @click="cancelDissolveGroup">
                    {{ $t('cancel') }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </div>

          <!-- Member settings -->
          <div v-else>
            <h3 class="text-subtitle-1 mb-2">{{ $t('groupSettings.notificationPrefs') }}</h3>
            <v-switch v-model="form.notifications.planUpdates" :label="$t('groupSettings.planUpdates')" hide-details density="comfortable" inset />
            <v-switch v-model="form.notifications.mentions" :label="$t('groupSettings.mentions')" hide-details density="comfortable" inset />
            <v-switch v-model="form.notifications.rankings" :label="$t('groupSettings.rankings')" hide-details density="comfortable" inset />

            <h3 class="text-subtitle-1 mt-6 mb-2">{{ $t('groupSettings.learningVisibility') }}</h3>
            <v-switch v-model="form.privacy.shareMetrics" :label="$t('groupSettings.shareMetricsWithGroup')" hide-details density="comfortable" inset />
            <v-switch v-model="form.privacy.showOnLeaderboard" :label="$t('groupSettings.showOnLeaderboard')" hide-details density="comfortable" inset />

            <h3 class="text-subtitle-1 mt-6 mb-2">{{ $t('groupSettings.myPlans') }}</h3>
            <v-list density="compact">
              <v-list-item v-for="sp in form.myPlans" :key="sp.planId">
                <v-list-item-title>{{ sp.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ $t('groupSettings.currentCohort') }}{{ $t(':') }}{{ sp.cohortTitle || $t('groupSettings.notJoined') }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </template>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="close">{{ $t('close') }}</v-btn>
        <v-btn color="primary" :disabled="loading" @click="save">{{ $t('save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { apiClient } from '@/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

export default {
  name: 'GroupSettingsDialog',
  components: { LoadingSpinner },
  props: {
    modelValue: { type: Boolean, default: false },
    groupId: { type: [String, Number], required: true },
    role: { type: String, default: '' }, // 'manager' | 'member' | ''
    inline: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      internalOpen: this.modelValue,
      loading: false,
      error: null,
      dissolveDialog: false,
      enteredGroupName: '',
      groupName: '',
      originalGroupName: '',
      form: {
        profile: { name: '', bio: '' },
        sharedPlans: [],
        cohorts: [],
        notifications: { planUpdates: true, mentions: true, rankings: false },
        privacy: { shareMetrics: true, showOnLeaderboard: true },
        myPlans: [],
      },
      permOptions: [
        { title: this.$t('groupSettings.perms.readonly'), value: 'Readonly' },
        { title: this.$t('groupSettings.perms.comment'), value: 'Comment' },
        { title: this.$t('groupSettings.perms.editable'), value: 'Editable' },
        { title: this.$t('groupSettings.perms.admin'), value: 'Admin' },
      ],
      enrollOptions: [
        { title: this.$t('groupSettings.enroll.optIn'), value: 'OptIn' },
        { title: this.$t('groupSettings.enroll.auto'), value: 'Auto' },
      ],
    }
  },
  computed: {
    isManager() { return String(this.role).toLowerCase() === 'manager' },
  },
  watch: {
    modelValue(val) { this.internalOpen = val; if (val) this.fetch() },
    internalOpen(val) { this.$emit('update:modelValue', val) },
  },
  methods: {
    close() { this.internalOpen = false },
    notifyError(message) {
      this.$toast?.error?.(message) || alert(message)
    },
    notifySuccess(message) {
      this.$toast?.success?.(message) || alert(message)
    },
    normalizeGroupName(value) {
      return String(value || '').trim().toLowerCase()
    },
    async fetchGroupName() {
      try {
        const res = await apiClient.get(`/StudyGroup/GetStudyGroupById/${this.groupId}`)
        const data = res?.data || {}
        this.groupName = data.name || data.Name || ''
      } catch (e) {
        this.groupName = ''
      }
    },
    async fetch() {
      this.loading = true; this.error = null
      try {
        const as = this.isManager ? 'manager' : 'member'
        const res = await apiClient.get(`/StudyGroup/Settings/${this.groupId}`, { params: { as } })
        const data = res?.data || {}
        // merge into form
        if (data.profile) this.form.profile = { ...this.form.profile, ...data.profile }
        if (Array.isArray(data.sharedPlans)) this.form.sharedPlans = data.sharedPlans
        if (Array.isArray(data.cohorts)) this.form.cohorts = data.cohorts
        if (data.notifications) this.form.notifications = { ...this.form.notifications, ...data.notifications }
        if (data.privacy) this.form.privacy = { ...this.form.privacy, ...data.privacy }
        if (Array.isArray(data.myPlans)) this.form.myPlans = data.myPlans
        this.originalGroupName = this.form.profile.name
        if (!this.originalGroupName) {
          await this.fetchGroupName()
          this.originalGroupName = this.groupName
        }
      } catch (e) {
        this.error = 'groupSettings.loadFailed'
      } finally {
        this.loading = false
      }
    },
    async save() {
      try {
        this.loading = true
        if (String(process.env.VUE_APP_USE_MOCKS).toLowerCase() === 'true') {
          await new Promise(r => setTimeout(r, 400))
          this.close()
          return
        }
        await apiClient.post(`/StudyGroup/Settings/${this.groupId}`, { ...this.form })
        this.close()
      } catch (e) {
        this.error = 'groupSettings.saveFailed'
      } finally {
        this.loading = false
      }
    },
    promptDissolveGroup() {
      if (!this.isManager) {
        this.notifyError(this.$t('studygroup.errors.noDissolvePermission'))
        return
      }
      this.enteredGroupName = ''
      this.dissolveDialog = true
    },
    async confirmDissolveGroup() {
      if (!this.isManager) {
        this.notifyError(this.$t('studygroup.errors.noDissolvePermission'))
        return
      }
      const expectedName = this.normalizeGroupName(
        this.originalGroupName || this.groupName || this.form.profile.name
      )
      const enteredName = this.normalizeGroupName(this.enteredGroupName)
      if (!expectedName || enteredName !== expectedName) {
        this.notifyError(this.$t('studygroup.errors.invalidGroupName'))
        return
      }
      try {
        await apiClient.post('/StudyGroup/DissolveStudyGroup', {
          userId: this.$store.state.currentUserID,
          groupId: this.groupId,
        })
        this.notifySuccess(this.$t('studygroup.success.dissolved'))
        this.dissolveDialog = false
      } catch (error) {
        console.error('Error dissolving group:', error)
        this.notifyError(this.$t('studygroup.errors.dissolveFailed'))
      }
    },
    cancelDissolveGroup() {
      this.dissolveDialog = false
      this.enteredGroupName = ''
    },
  },
  mounted() {
    if (this.inline) {
      this.fetch()
    } else if (this.modelValue) {
      this.fetch()
    }
  },
}
</script>

<style scoped>
.dissolve-button {
  color: #ec0017;
  border: 2px solid #ec0017;
  padding: 8px 16px;

  &:hover {
    background-color: #ec0017;
    color: white;
  }

  &:focus {
    background-color: #aa1b1d;
    border: 2px solid #aa1b1d;
    color: white;
  }

  &:active {
    background-color: #aa1b1d;
    border: 2px solid #aa1b1d;
    color: white;
  }
}
</style>

