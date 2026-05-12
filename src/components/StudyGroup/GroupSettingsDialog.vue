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
                  <th class="text-left">{{ $t('groupSettings.class') }}</th>
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
                  <th class="text-left">{{ $t('groupSettings.class') }}</th>
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
    role: { type: String, default: '' },
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
      originalProfile: { name: '', bio: '' },
      originalSharedPlans: [],
      originalCohorts: [],
      form: {
        profile: { name: '', bio: '' },
        sharedPlans: [],
        cohorts: [],
        notifications: { planUpdates: true, mentions: true, rankings: false },
        privacy: { shareMetrics: true, showOnLeaderboard: true },
        myPlans: [],
      },
      permOptions: [
        { title: this.$t('groupSettings.perms.readonly'), value: 'view' },
        { title: this.$t('groupSettings.perms.comment'), value: 'comment' },
        { title: this.$t('groupSettings.perms.editable'), value: 'edit' },
        { title: this.$t('groupSettings.perms.admin'), value: 'admin' },
      ],
      enrollOptions: [
        { title: this.$t('groupSettings.enroll.optIn'), value: 'OptIn' },
        { title: this.$t('groupSettings.enroll.auto'), value: 'Auto' },
      ],
    }
  },
  computed: {
    isManager() {
      const v = String(this.role || '').toLowerCase()
      return v === 'owner' || v === 'admin' || v === 'manager'
    },
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
    cloneDeep(value) {
      try { return JSON.parse(JSON.stringify(value)) } catch (_) { return value }
    },
    normalizePermission(value) {
      const v = String(value || '').toLowerCase()
      if (v === 'readonly' || v === 'read' || v === 'view') return 'view'
      if (v === 'comment') return 'comment'
      if (v === 'editable' || v === 'edit') return 'edit'
      if (v === 'admin') return 'admin'
      return 'view'
    },
    normalizeEnrollMode(value) {
      if (value === null || value === undefined) return 'OptIn'
      if (typeof value === 'number') return value === 1 ? 'Auto' : 'OptIn'
      const v = String(value).toLowerCase()
      if (v === '1' || v === 'auto') return 'Auto'
      return 'OptIn'
    },
    serializeEnrollMode(value) {
      return this.normalizeEnrollMode(value) === 'Auto' ? 1 : 0
    },
    normalizeGroupName(value) {
      return String(value || '').trim().toLowerCase()
    },
    async fetchGroupName() {
      try {
        const res = await apiClient.get(`/StudyGroup/SettingsBootstrap/${this.groupId}`)
        const data = res?.data?.group || {}
        this.groupName = data.name || data.Name || ''
      } catch (e) {
        this.groupName = ''
      }
    },
    async fetch() {
      this.loading = true; this.error = null
      try {
        const res = await apiClient.get(`/StudyGroup/SettingsBootstrap/${this.groupId}`)
        const payload = res?.data || {}
        const data = payload.group || {}
        const hasGroupPayload = !!data && Object.keys(data).length > 0

        this.form.profile = {
          name: data.name || data.Name || '',
          bio: data.description || data.Description || '',
        }
        this.originalProfile = { ...this.form.profile }
        this.groupName = this.form.profile.name

        const sharedPlans = (Array.isArray(payload.sharedPlans) ? payload.sharedPlans : []).map((p) => {
          const stableId = p.studyPlanStableId || p.StudyPlanStableId || p.studyPlanId || p.StudyPlanId || p.id || p.Id
          const planVersionId = p.planVersionId || p.PlanVersionId || p.activePlanVersionId || p.ActivePlanVersionId
          return {
            id: stableId,
            studyPlanStableId: stableId,
            planVersionId,
            permission: this.normalizePermission(p.permission || p.Permission),
            autoEnroll: Boolean(p.autoEnroll ?? p.AutoEnroll),
            pinnedVersionNumber: p.pinnedVersionNumber ?? p.PinnedVersionNumber ?? null,
            title: p.title || p.planTitle || p.Title || p.PlanTitle || stableId || planVersionId || '',
          }
        })

        const cohorts = (Array.isArray(payload.cohorts) ? payload.cohorts : []).map((c) => ({
          id: c.id || c.Id,
          title: c.title || c.Title,
          planTitle: c.planTitle || c.PlanTitle,
          enrollMode: this.normalizeEnrollMode(c.enrollMode ?? c.EnrollMode),
          pinnedVersionNumber: c.pinnedVersionNumber ?? c.PinnedVersionNumber ?? null,
          planStableId: c.planStableId || c.PlanStableId || c.studyPlanStableId || c.StudyPlanStableId,
          planVersionId: c.planVersionId || c.PlanVersionId || c.studyPlanId || c.StudyPlanId,
        }))

        this.form.sharedPlans = sharedPlans
        this.form.cohorts = cohorts
        if (this.isManager) {
          this.form.myPlans = []
        }

        if (!this.isManager) {
          this.form.myPlans = (Array.isArray(payload.myPlans) ? payload.myPlans : []).map((p) => ({
            planId: p.planId || p.PlanId,
            title: p.title || p.Title || '',
            cohortTitle: p.cohortTitle || p.CohortTitle || '',
          }))
        }

        this.originalSharedPlans = this.cloneDeep(this.form.sharedPlans)
        this.originalCohorts = this.cloneDeep(this.form.cohorts)
        this.originalGroupName = this.form.profile.name || this.groupName || ''

        if (!hasGroupPayload) {
          throw new Error('load_failed')
        }
      } catch (e) {
        console.error('Failed to load group settings:', e)
        this.error = 'groupSettings.loadFailed'
      } finally {
        this.loading = false
      }
    },
    async save() {
      try {
        this.loading = true; this.error = null
        if (String(process.env.VUE_APP_USE_MOCKS).toLowerCase() === 'true') {
          await new Promise(r => setTimeout(r, 400))
          if (!this.inline) this.close()
          return
        }

        if (!this.isManager) {
          this.notifyError(this.$t('groupSettings.saveFailed'))
          return
        }

        const ops = []

        const newName = String(this.form.profile.name || '').trim()
        const newBio = String(this.form.profile.bio || '')
        if (newName && newName !== (this.originalProfile.name || '')) {
          ops.push(apiClient.post(`/StudyGroupManage/RenameGroup/${this.groupId}`, { newName }))
        }
        if (newBio !== (this.originalProfile.bio || '')) {
          ops.push(apiClient.post(`/StudyGroupManage/EditDescription/${this.groupId}`, { newDescription: newBio }))
        }

        const originalPlans = new Map(this.originalSharedPlans.map(p => [String(p.studyPlanStableId || p.id), p]))
        for (const p of this.form.sharedPlans) {
          const key = String(p.studyPlanStableId || p.id || '')
          if (!key) continue
          const orig = originalPlans.get(key)
          const permission = this.normalizePermission(p.permission)
          const autoEnroll = Boolean(p.autoEnroll)
          const pinnedVersionNumber = p.pinnedVersionNumber ?? orig?.pinnedVersionNumber ?? null
          if (!orig || permission !== this.normalizePermission(orig.permission) || autoEnroll !== Boolean(orig.autoEnroll)) {
            ops.push(apiClient.post(`/StudyGroups/${this.groupId}/Plans/${key}/Share`, {
              permission,
              autoEnroll,
              versionNumber: pinnedVersionNumber,
            }))
          }
        }

        const originalCohorts = new Map(this.originalCohorts.map(c => [String(c.id), c]))
        for (const c of this.form.cohorts) {
          const key = String(c.id || '')
          if (!key) continue
          const orig = originalCohorts.get(key)
          const enrollMode = this.serializeEnrollMode(c.enrollMode)
          const origEnroll = orig ? this.serializeEnrollMode(orig.enrollMode) : null
          if (!orig || enrollMode !== origEnroll) {
            ops.push(apiClient.patch(`/Groups/${this.groupId}/Cohorts/${key}`, {
              enrollMode,
              pinnedVersionNumber: c.pinnedVersionNumber ?? orig?.pinnedVersionNumber ?? null,
            }))
          }
        }

        if (ops.length) {
          await Promise.all(ops)
        }

        if (!this.inline) this.close()
        await this.fetch()
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
      console.log('Dissolve confirmation:', { expectedName, enteredName })
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
