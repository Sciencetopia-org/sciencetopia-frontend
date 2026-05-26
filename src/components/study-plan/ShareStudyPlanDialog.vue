<template>
  <v-dialog v-model="internal" max-width="720" persistent>
    <v-card class="sc-dialog-card" rounded="xl">
      <v-card-title class="pb-2">
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-h6">{{ $t('studyplan.shareDialog.title') }}</div>
            <div class="text-caption text-medium-emphasis">{{ $t('studyplan.shareDialog.subtitle') }}</div>
          </div>
          <v-btn icon="mdi-close" variant="text" :disabled="syncingShare || unsharing || creating || savingSharingSettings" @click="close" />
        </div>
      </v-card-title>
      <v-card-text class="sc-dialog-body pt-2">
        <v-skeleton-loader v-if="initialLoading" type="list-item-two-line, list-item-two-line" class="mb-4" />
        <v-alert v-else :type="simpleStatusType" variant="tonal" density="comfortable" class="mb-4">
          <div class="font-weight-medium">{{ simpleStatusTitle }}</div>
          <div class="text-caption mt-1">{{ simpleStatusText }}</div>
        </v-alert>

        <v-card v-if="canEditPlan" class="pa-4 mb-4" variant="outlined">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-subtitle-2">{{ $t('studyplan.shareDialog.allowOthersTitle') }}</div>
              <div class="text-caption text-medium-emphasis">{{ $t('studyplan.shareDialog.allowOthersText') }}</div>
            </div>
            <v-switch
              v-model="allowCohortSharing"
              density="compact"
              hide-details
              :loading="savingSharingSettings"
              :disabled="actionLocked"
              @update:model-value="setCohortSharing"
            />
          </div>
          <v-alert v-if="sharingSettingsEndpointMissing" type="warning" variant="tonal" density="comfortable" class="mt-3">
            {{ $t('studyplan.shareDialog.endpointMissing') }}
          </v-alert>
        </v-card>

        <v-card class="pa-4" variant="outlined">
          <div class="text-subtitle-2 mb-3">{{ $t('studyplan.shareDialog.selectManagedGroup') }}</div>
          <v-skeleton-loader v-if="loadingGroups" type="list-item-two-line" />
          <template v-else>
            <v-select
              v-if="manageableGroups.length"
              v-model="selectedGroupId"
              :items="manageableGroups"
              item-title="displayName"
              item-value="idValue"
              :label="$t('studygroup.studygroup')"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
              :disabled="actionLocked"
              :loading="selectionLoading"
              @update:model-value="selectStudyGroupById"
            />
            <v-alert v-else type="info" variant="tonal" density="comfortable">
              {{ $t('studyplan.shareDialog.noManagedGroups') }}
            </v-alert>
          </template>

          <v-btn
            block
            color="primary"
            size="large"
            class="mt-4"
            :loading="syncingShare"
            :disabled="actionLocked || !canShareSelectedGroup || isShared"
            @click="shareToGroup"
          >
            {{ isShared ? $t('studyplan.shareDialog.adopted') : $t('studyplan.shareDialog.adopt') }}
          </v-btn>
          <v-btn
            v-if="isShared"
            block
            color="primary"
            variant="tonal"
            class="mt-2"
            prepend-icon="mdi-account-group-outline"
            :disabled="actionLocked || !groupPlanRouteId"
            @click="openGroupPlan"
          >
            {{ $t('studyplan.shareDialog.viewInGroup') }}
          </v-btn>
          <div v-if="shareBlockedReason" class="text-caption text-medium-emphasis mt-2 text-center">
            {{ shareBlockedReason }}
          </div>
        </v-card>

        <v-expand-transition>
          <div v-if="isShared" class="mt-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <div>
                <div class="text-subtitle-2">{{ $t('studyplan.shareDialog.advancedSettings') }}</div>
                <div class="text-caption text-medium-emphasis">{{ $t('studyplan.shareDialog.advancedText') }}</div>
              </div>
              <v-btn variant="text" size="small" :disabled="selectionLoading || actionLocked" @click="showAdvancedSettings = !showAdvancedSettings">
                {{ showAdvancedSettings ? $t('studyplan.shareDialog.collapse') : $t('studyplan.shareDialog.expand') }}
              </v-btn>
            </div>

            <v-expand-transition>
              <div v-if="showAdvancedSettings">
                <v-card class="pa-4 mb-3" variant="outlined">
                  <div class="text-subtitle-2 mb-3">{{ $t('studyplan.shareDialog.groupSettings') }}</div>
                  <v-select
                    v-model="shareForm.permission"
                    :items="localizedPermissionOptions"
                    item-title="title"
                    item-value="value"
                    :label="$t('studyplan.shareDialog.inGroupPermission')"
                    :hint="$t('studyplan.shareDialog.permissionHint')"
                    persistent-hint
                    density="compact"
                    :disabled="actionLocked"
                  />
                  <v-switch
                    v-model="shareForm.autoEnroll"
                    density="compact"
                    :label="$t('cohort.autoEnroll')"
                    :disabled="actionLocked"
                  />
                  <div class="d-flex justify-end">
                    <v-btn color="primary" variant="tonal" :loading="syncingShare" :disabled="actionLocked || !canShareSelectedGroup" @click="shareToGroup">
                      {{ $t('studyplan.shareDialog.saveGroupSettings') }}
                    </v-btn>
                    <v-btn class="ml-2" variant="outlined" color="error" :loading="unsharing" :disabled="actionLocked" @click="unshareFromGroup">
                      {{ $t('studyplan.shareDialog.cancelAdoption') }}
                    </v-btn>
                  </div>
                </v-card>

                <v-card class="pa-4" variant="outlined">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="text-subtitle-2">{{ $t('cohort.select') }}</div>
                    <v-chip size="x-small" label>{{ $t('studyplan.shareDialog.classCount', { count: cohorts.length }) }}</v-chip>
                  </div>
                  <v-skeleton-loader v-if="loadingCohorts" type="list-item-two-line" />
                  <v-list v-else-if="cohorts.length" density="compact" class="mb-3">
                    <v-list-item v-for="c in cohorts" :key="c.id">
                      <v-list-item-title>{{ c.title || c.id }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ c.visibility || 'group' }} | {{ c.enrollMode || 'OptIn' }} | v{{ c.pinnedVersionNumber || '-' }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                  <v-alert v-else type="info" variant="tonal" density="comfortable" class="mb-3">
                    {{ $t('studyplan.shareDialog.noClasses') }}
                  </v-alert>

                  <v-text-field
                    v-model="createForm.title"
                    :label="$t('studyplan.shareDialog.newClassName')"
                    density="compact"
                    variant="outlined"
                    required
                    :disabled="actionLocked || loadingCohorts"
                  />
                  <div class="d-flex justify-end">
                    <v-btn color="primary" :loading="creating" :disabled="actionLocked || loadingCohorts || !createForm.title" @click="createCohort">
                      {{ $t('studyplan.shareDialog.createClass') }}
                    </v-btn>
                  </div>
                </v-card>
              </div>
            </v-expand-transition>
          </div>
        </v-expand-transition>
      </v-card-text>

      <v-card-actions class="sc-form-actions sc-form-actions--end">
        <v-btn class="sc-action-btn" variant="text" :disabled="syncingShare || unsharing || creating || savingSharingSettings" @click="close">{{ $t('close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { apiClient } from '@/api'
import { fetchEffectivePermissions, invalidateEffectivePermissions } from '@/services/effective-permissions'

export default {
  name: 'ShareStudyPlanDialog',
  emits: ['update:modelValue', 'permissions-updated'],
  props: {
    modelValue: { type: Boolean, default: false },
    planId: { type: [String, Number], required: true },
    planStableId: { type: [String, Number], default: '' },
  },
  data() {
    return {
      internal: this.modelValue,
      showAdvancedSettings: false,

      studyGroups: [],
      loadingGroups: false,
      selectedGroupId: null,
      loadingShare: false,
      loadingCohorts: false,
      syncingShare: false,
      unsharing: false,
      creating: false,
      loadingPermissions: false,
      savingSharingSettings: false,

      groupId: '',
      shareRecord: null,
      cohorts: [],
      planRole: '',
      canEditPlan: false,
      canAdoptPlanToCohort: false,
      allowCohortSharing: false,
      sharingSettingsEndpointMissing: false,

      shareForm: {
        permission: 'view',
        autoEnroll: false,
      },

      createForm: {
        title: '',
        visibility: 'group',
        enrollMode: 0,
      },

      permissionOptions: [
        { titleKey: 'groupSettings.perms.readonly', value: 'view' },
        { titleKey: 'groupSettings.perms.comment', value: 'comment' },
        { titleKey: 'groupSettings.perms.editable', value: 'edit' },
        { titleKey: 'groupSettings.perms.admin', value: 'admin' },
      ],
      enrollModeOptions: [
        { titleKey: 'groupSettings.enroll.optIn', value: 0 },
        { titleKey: 'groupSettings.enroll.auto', value: 1 },
      ],
    }
  },
  computed: {
    selectedGroup() {
      return this.studyGroups.find((g) => String(g.id || g.groupId) === String(this.selectedGroupId)) || null
    },
    manageableGroups() {
      return this.studyGroups
        .filter((g) => this.isManageRole(g?.role))
        .map((g) => {
          const id = g.id || g.groupId
          return {
            ...g,
            idValue: id,
            displayName: g.name || g.title || id,
          }
        })
    },
    localizedPermissionOptions() {
      return this.permissionOptions.map((item) => ({
        ...item,
        title: this.$t(item.titleKey),
      }))
    },
    sharePlanIdentifier() {
      return this.planStableId || this.planId
    },
    cohortPlanIdentifier() {
      return this.planStableId || this.shareRecord?.studyPlanStableId || this.shareRecord?.StudyPlanStableId || this.planId
    },
    simpleStatusType() {
      if (this.loadingPermissions) return 'info'
      return this.canAdoptPlanToCohort ? 'success' : 'warning'
    },
    simpleStatusTitle() {
      if (this.loadingPermissions) return this.$t('studyplan.shareDialog.status.checking')
      if (this.canAdoptPlanToCohort) return this.$t('studyplan.shareDialog.status.canAdopt')
      if (this.allowCohortSharing) return this.$t('studyplan.shareDialog.status.open')
      return this.$t('studyplan.shareDialog.status.closed')
    },
    simpleStatusText() {
      if (this.loadingPermissions) return this.$t('studyplan.shareDialog.status.wait')
      if (this.canAdoptPlanToCohort) return this.$t('studyplan.shareDialog.status.canAdoptText')
      if (this.allowCohortSharing) return this.$t('studyplan.shareDialog.status.openText')
      return this.canEditPlan
        ? this.$t('studyplan.shareDialog.status.ownerHint')
        : this.$t('studyplan.shareDialog.status.needPermission')
    },
    canManageSelectedGroup() {
      return !!this.groupId && this.isManageRole(this.selectedGroup?.role)
    },
    canShareSelectedGroup() {
      return this.canManageSelectedGroup && this.canAdoptPlanToCohort
    },
    initialLoading() {
      return this.loadingPermissions || this.loadingGroups
    },
    selectionLoading() {
      return this.loadingShare || this.loadingCohorts
    },
    actionLocked() {
      return this.initialLoading
        || this.selectionLoading
        || this.syncingShare
        || this.unsharing
        || this.creating
        || this.savingSharingSettings
    },
    shareBlockedReason() {
      if (this.initialLoading) return this.$t('studyplan.shareDialog.blocked.loading')
      if (this.selectionLoading) return this.$t('studyplan.shareDialog.blocked.refreshing')
      if (!this.groupId) return this.$t('studyplan.shareDialog.blocked.selectGroup')
      if (!this.canManageSelectedGroup) return this.$t('studyplan.shareDialog.blocked.needManager')
      if (!this.canAdoptPlanToCohort) return this.$t('studyplan.shareDialog.blocked.noPermission')
      return ''
    },
    isShared() {
      return !!this.shareRecord
    },
    groupPlanRouteId() {
      return this.cohortPlanIdentifier || this.sharePlanIdentifier
    },
  },
  watch: {
    modelValue(v) {
      this.internal = v
      if (v) {
        this.fetchPlanPermissions()
        this.fetchStudyGroups()
      }
    },
    internal(v) {
      this.$emit('update:modelValue', v)
    },
    planId: {
      immediate: true,
      handler() {
        if (this.internal) {
          this.fetchPlanPermissions()
          this.refreshCurrentSelection()
        }
      },
    },
    planStableId() {
      if (this.internal) this.refreshCurrentSelection()
    },
  },
  methods: {
    close() {
      this.internal = false
    },
    normalizeGroupRole(role) {
      const v = String(role || '').trim().toLowerCase()
      if (v === 'owner') return 'Owner'
      if (v === 'admin' || v === 'manager') return 'Admin'
      return 'Member'
    },
    isManageRole(role) {
      const r = this.normalizeGroupRole(role)
      return r === 'Owner' || r === 'Admin'
    },
    async refreshCurrentSelection() {
      if (!this.selectedGroupId) return
      await Promise.all([this.fetchShareStatus(), this.fetchCohorts()])
    },
    async fetchPlanPermissions() {
      if (!this.planId) return
      this.loadingPermissions = true
      try {
        const perms = await this.fetchEffectivePermissionsForKnownIds()
        this.planRole = perms?.role || ''
        this.canEditPlan = !!perms?.CanEditPlan
        this.canAdoptPlanToCohort = !!(perms?.CanAdoptPlanToCohort || perms?.CanSharePlanToCohort)
        this.allowCohortSharing = !!perms?.AllowCohortSharing
      } catch (e) {
        console.error('load plan permissions failed', e)
        this.canEditPlan = false
        this.canAdoptPlanToCohort = false
        this.allowCohortSharing = false
        this.planRole = ''
      } finally {
        this.loadingPermissions = false
      }
    },
    async fetchEffectivePermissionsForKnownIds() {
      const ids = this.planIdentifierCandidates()
      for (const id of ids) {
        const perms = await fetchEffectivePermissions({ planId: id, force: true })
        if (perms) return perms
      }
      return null
    },
    planIdentifierCandidates() {
      return [this.planId, this.planStableId]
        .filter((id) => id !== undefined && id !== null && String(id).trim())
        .map((id) => String(id))
        .filter((id, idx, arr) => arr.indexOf(id) === idx)
    },
    async setCohortSharing(value) {
      if (!this.planId || !this.canEditPlan) return
      this.savingSharingSettings = true
      this.sharingSettingsEndpointMissing = false
      try {
        await this.postSharingSettings(value)
        this.planIdentifierCandidates().forEach((id) => invalidateEffectivePermissions(id))
        await this.fetchPlanPermissions()
        this.$emit('permissions-updated')
        this.$toast?.success?.(this.$t('studyplan.shareDialog.toast.settingsUpdated'))
      } catch (e) {
        console.error('update cohort sharing setting failed', e)
        this.allowCohortSharing = !value
        if (e?.response?.status === 404) {
          this.sharingSettingsEndpointMissing = true
          this.$toast?.error?.(this.$t('studyplan.shareDialog.toast.endpointMissing'))
        } else {
          this.$toast?.error?.(this.$t('studyplan.shareDialog.toast.settingsFailed'))
        }
      } finally {
        this.savingSharingSettings = false
      }
    },
    async postSharingSettings(value) {
      let lastError = null
      for (const id of this.planIdentifierCandidates()) {
        try {
          return await apiClient.post(`/StudyPlans/${id}/SharingSettings`, { allowCohortSharing: !!value })
        } catch (e) {
          lastError = e
          if (e?.response?.status !== 404) throw e
        }
      }
      throw lastError || new Error('No plan identifier available')
    },

    /** 加载可选择的 StudyGroup（按当前登录用户） */
    async fetchStudyGroups() {
      this.loadingGroups = true
      try {
        const res = await apiClient.get('/StudyGroup/GetStudyGroup')

        this.studyGroups = Array.isArray(res.data) ? res.data : []
        const manageable = this.studyGroups.find((g) => this.isManageRole(g.role))
        const selected = manageable || null
        if (selected) {
          this.selectStudyGroup(selected)
        } else {
          this.selectedGroupId = null
          this.groupId = ''
          this.shareRecord = null
          this.cohorts = []
        }
      } catch (e) {
        console.error('load study groups failed', e)
        this.studyGroups = []
      } finally {
        this.loadingGroups = false
      }
    },

    async selectStudyGroupById(id) {
      if (this.actionLocked) return
      const group = this.manageableGroups.find((g) => String(g.idValue) === String(id))
      await this.selectStudyGroup(group)
    },

    async selectStudyGroup(g) {
      if (!this.isManageRole(g?.role)) {
        this.selectedGroupId = null
        this.groupId = ''
        this.shareRecord = null
        this.cohorts = []
        return
      }
      const id = g?.id || g?.groupId
      this.selectedGroupId = id
      this.groupId = id || ''
      this.shareRecord = null
      this.cohorts = []
      if (!this.groupId) return
      await Promise.all([this.fetchShareStatus(), this.fetchCohorts()])
    },

    async fetchShareStatus() {
      if (!this.groupId || !this.sharePlanIdentifier) return
      this.loadingShare = true
      try {
        const res = await apiClient.get(`/StudyGroups/${this.groupId}/Plans/${this.sharePlanIdentifier}/Share`)
        const data = res?.data || null
        this.shareRecord = data
        this.showAdvancedSettings = !!data
        this.shareForm.permission = String(data?.permission || 'view').toLowerCase()
        this.shareForm.autoEnroll = Boolean(data?.autoEnroll)
      } catch (e) {
        if (e?.response?.status === 404) {
          this.shareRecord = null
          this.showAdvancedSettings = false
          this.shareForm.permission = 'view'
          this.shareForm.autoEnroll = false
          return
        }
        console.error('load share status failed', e)
      } finally {
        this.loadingShare = false
      }
    },

    async fetchCohorts() {
      if (!this.groupId || !this.cohortPlanIdentifier) return
      this.loadingCohorts = true
      try {
        const res = await apiClient.get(`/Groups/${this.groupId}/Plans/${this.cohortPlanIdentifier}/Cohorts`)
        this.cohorts = Array.isArray(res?.data) ? res.data : []
      } catch (e) {
        console.error('load cohorts failed', e)
        this.cohorts = []
      } finally {
        this.loadingCohorts = false
      }
    },

    async shareToGroup(ignoreOwnBusy = false) {
      if ((!ignoreOwnBusy && this.actionLocked) || !this.sharePlanIdentifier || !this.groupId || !this.canShareSelectedGroup) return false
      this.syncingShare = true
      try {
        const payload = {
          permission: this.shareForm.permission,
          autoEnroll: this.shareForm.autoEnroll,
        }
        await apiClient.post(`/StudyGroups/${this.groupId}/Plans/${this.sharePlanIdentifier}/Share`, payload)
        await this.fetchShareStatus()
        this.showAdvancedSettings = true
        this.$toast?.success?.(this.$t('studyplan.shareDialog.toast.shareSaved'))
        return true
      } catch (e) {
        console.error('share failed', e)
        this.$toast?.error?.(this.$t('studyplan.shareDialog.toast.shareFailed'))
        return false
      } finally {
        this.syncingShare = false
      }
    },

    async unshareFromGroup() {
      if (this.actionLocked || !this.groupId || !this.sharePlanIdentifier) return
      this.unsharing = true
      try {
        await apiClient.delete(`/StudyGroups/${this.groupId}/Plans/${this.sharePlanIdentifier}`)
        this.shareRecord = null
        this.cohorts = []
        this.$toast?.success?.(this.$t('studyplan.shareDialog.toast.unshared'))
      } catch (e) {
        console.error('unshare failed', e)
        this.$toast?.error?.(this.$t('studyplan.shareDialog.toast.unshareFailed'))
      } finally {
        this.unsharing = false
      }
    },

    async createCohort() {
      if (this.actionLocked || !this.groupId || !this.canShareSelectedGroup || !this.createForm.title) return
      const requestedTitle = String(this.createForm.title || '').trim()
      this.creating = true
      try {
        if (!this.isShared) {
          const shared = await this.shareToGroup(true)
          if (!shared) return
        }
        if (!this.cohortPlanIdentifier) throw new Error('Missing stable plan identifier for cohort route')

        const payload = {
          title: this.createForm.title,
          visibility: this.createForm.visibility,
          enrollMode: this.createForm.enrollMode,
        }
        await apiClient.post(`/Groups/${this.groupId}/Plans/${this.cohortPlanIdentifier}/Cohorts`, payload)
        await this.fetchCohorts()
        this.createForm.title = ''
        this.$toast?.success?.(this.$t('studyplan.shareDialog.toast.classCreated'))
      } catch (e) {
        if (e?.response?.status === 500 && await this.refreshAndDetectCreatedCohort(requestedTitle)) {
          this.createForm.title = ''
          this.$toast?.success?.(this.$t('studyplan.shareDialog.toast.classCreatedSyncLater'))
          return
        }
        console.error('create cohort failed', e?.response?.data || e)
        this.$toast?.error?.(this.extractErrorMessage(e) || this.$t('studyplan.shareDialog.toast.createClassFailed'))
      } finally {
        this.creating = false
      }
    },
    async refreshAndDetectCreatedCohort(title) {
      if (!title) return false
      await this.fetchCohorts()
      return this.cohorts.some((c) => String(c?.title || '').trim() === title)
    },
    extractErrorMessage(e) {
      const data = e?.response?.data
      if (!data) return ''
      if (typeof data === 'string') return data
      if (typeof data.message === 'string') return data.message
      if (data.errors && typeof data.errors === 'object') {
        const first = Object.values(data.errors).flat().find(Boolean)
        if (first) return String(first)
      }
      return ''
    },
    openGroupPlan() {
      if (!this.groupId || !this.groupPlanRouteId) return
      this.internal = false
      this.$router.push({
        name: 'GroupPlanWorkspace',
        params: {
          groupId: this.groupId,
          planId: this.groupPlanRouteId,
        },
      })
    },
  },
}
</script>
