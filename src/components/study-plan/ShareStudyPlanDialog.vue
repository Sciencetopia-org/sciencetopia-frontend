<template>
  <v-dialog v-model="internal" max-width="720" persistent>
    <v-card rounded="xl">
      <v-card-title class="pb-2">
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-h6">采用到小组</div>
            <div class="text-caption text-medium-emphasis">把这个学习计划放到你管理的小组中使用</div>
          </div>
          <v-btn icon="mdi-close" variant="text" :disabled="syncingShare || unsharing || creating || savingSharingSettings" @click="close" />
        </div>
      </v-card-title>
      <v-card-text class="pt-2">
        <v-skeleton-loader v-if="initialLoading" type="list-item-two-line, list-item-two-line" class="mb-4" />
        <v-alert v-else :type="simpleStatusType" variant="tonal" density="comfortable" class="mb-4">
          <div class="font-weight-medium">{{ simpleStatusTitle }}</div>
          <div class="text-caption mt-1">{{ simpleStatusText }}</div>
        </v-alert>

        <v-card v-if="canEditPlan" class="pa-4 mb-4" variant="outlined">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-subtitle-2">允许其他使用者采用到小组</div>
              <div class="text-caption text-medium-emphasis">开启后，可读此计划的人也能把它采用到自己管理的小组；不会授予编辑计划的权限。</div>
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
            后端尚未启用计划采用设置接口。请确认后端服务已重启并包含最新代码。
          </v-alert>
        </v-card>

        <v-card class="pa-4" variant="outlined">
          <div class="text-subtitle-2 mb-3">选择你管理的小组</div>
          <v-skeleton-loader v-if="loadingGroups" type="list-item-two-line" />
          <template v-else>
            <v-select
              v-if="manageableGroups.length"
              v-model="selectedGroupId"
              :items="manageableGroups"
              item-title="displayName"
              item-value="idValue"
              label="小组"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
              :disabled="actionLocked"
              :loading="selectionLoading"
              @update:model-value="selectStudyGroupById"
            />
            <v-alert v-else type="info" variant="tonal" density="comfortable">
              你目前没有可管理的小组。只有小组 Owner/Admin 可以采用计划。
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
            {{ isShared ? '已采用到此小组' : '采用到此小组' }}
          </v-btn>
          <div v-if="shareBlockedReason" class="text-caption text-medium-emphasis mt-2 text-center">
            {{ shareBlockedReason }}
          </div>
        </v-card>

        <v-expand-transition>
          <div v-if="isShared" class="mt-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <div>
                <div class="text-subtitle-2">高级设置</div>
                <div class="text-caption text-medium-emphasis">需要时再调整小组权限或创建班级</div>
              </div>
              <v-btn variant="text" size="small" :disabled="selectionLoading || actionLocked" @click="showAdvancedSettings = !showAdvancedSettings">
                {{ showAdvancedSettings ? '收起' : '展开' }}
              </v-btn>
            </div>

            <v-expand-transition>
              <div v-if="showAdvancedSettings">
                <v-card class="pa-4 mb-3" variant="outlined">
                  <div class="text-subtitle-2 mb-3">小组设置</div>
                  <v-select
                    v-model="shareForm.permission"
                    :items="permissionOptions"
                    item-title="title"
                    item-value="value"
                    label="小组内权限"
                    hint="只影响小组和班级内协作，不授予计划内容编辑权"
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
                      保存小组设置
                    </v-btn>
                    <v-btn class="ml-2" variant="outlined" color="error" :loading="unsharing" :disabled="actionLocked" @click="unshareFromGroup">
                      取消采用
                    </v-btn>
                  </div>
                </v-card>

                <v-card class="pa-4" variant="outlined">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="text-subtitle-2">班级</div>
                    <v-chip size="x-small" label>{{ cohorts.length }} 个</v-chip>
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
                    还没有班级。
                  </v-alert>

                  <v-text-field
                    v-model="createForm.title"
                    label="新班级名称"
                    density="compact"
                    variant="outlined"
                    required
                    :disabled="actionLocked || loadingCohorts"
                  />
                  <div class="d-flex justify-end">
                    <v-btn color="primary" :loading="creating" :disabled="actionLocked || loadingCohorts || !createForm.title" @click="createCohort">
                      创建班级
                    </v-btn>
                  </div>
                </v-card>
              </div>
            </v-expand-transition>
          </div>
        </v-expand-transition>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" :disabled="syncingShare || unsharing || creating || savingSharingSettings" @click="close">{{ $t('close') }}</v-btn>
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
        { title: '只读', value: 'view' },
        { title: '可评论', value: 'comment' },
        { title: '可编辑', value: 'edit' },
        { title: '管理', value: 'admin' },
      ],
      enrollModeOptions: [
        { title: '手动加入', value: 0 },
        { title: '自动加入', value: 1 },
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
      if (this.loadingPermissions) return '正在检查采用权限'
      if (this.canAdoptPlanToCohort) return '你可以采用此计划'
      if (this.allowCohortSharing) return '此计划已开放采用'
      return '此计划暂不能采用'
    },
    simpleStatusText() {
      if (this.loadingPermissions) return '请稍候。'
      if (this.canAdoptPlanToCohort) return '选择一个你管理的小组即可采用。采用不会改变原计划的编辑权限。'
      if (this.allowCohortSharing) return '你仍需要对计划有可读权限，并且选择自己管理的小组。'
      return this.canEditPlan ? '你可以打开下方开关，让其他使用者也能采用。' : '需要计划编辑团队开放采用，或将你加入编辑团队。'
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
      if (this.initialLoading) return '正在加载权限和可管理小组。'
      if (this.selectionLoading) return '正在刷新当前小组的采用状态。'
      if (!this.groupId) return '先选择一个你管理的小组。'
      if (!this.canManageSelectedGroup) return '只有小组 Owner/Admin 可以采用计划或创建班级。'
      if (!this.canAdoptPlanToCohort) return '当前账号没有此计划的班级采用权限。'
      return ''
    },
    isShared() {
      return !!this.shareRecord
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
        this.$toast?.success?.('计划采用设置已更新')
      } catch (e) {
        console.error('update cohort sharing setting failed', e)
        this.allowCohortSharing = !value
        if (e?.response?.status === 404) {
          this.sharingSettingsEndpointMissing = true
          this.$toast?.error?.('计划采用设置接口不可用，请确认后端已重启')
        } else {
          this.$toast?.error?.('计划采用设置更新失败')
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
        this.$toast?.success?.('共享设置已保存')
        return true
      } catch (e) {
        console.error('share failed', e)
        this.$toast?.error?.('共享失败，请检查权限或数据')
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
        this.$toast?.success?.('已取消共享')
      } catch (e) {
        console.error('unshare failed', e)
        this.$toast?.error?.('取消共享失败')
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
        this.$toast?.success?.('班级创建成功')
      } catch (e) {
        if (e?.response?.status === 500 && await this.refreshAndDetectCreatedCohort(requestedTitle)) {
          this.createForm.title = ''
          this.$toast?.success?.('班级已创建；图谱同步可能稍后完成')
          return
        }
        console.error('create cohort failed', e?.response?.data || e)
        this.$toast?.error?.(this.extractErrorMessage(e) || '创建班级失败')
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
  },
}
</script>
