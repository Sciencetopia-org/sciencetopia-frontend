<template>
  <v-dialog v-model="internal" max-width="820" persistent>
    <v-card rounded="xl">
      <v-card-title>{{ $t('studyplan.share') }}</v-card-title>
      <v-card-text>
        <v-tabs v-model="tab" class="mb-2">
          <v-tab value="group">{{ $t('studygroup.studygroup') }}</v-tab>
          <v-tab value="user" disabled>{{ $t('user.personalcenter') }}</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- Group share + cohort sessions -->
          <v-window-item value="group">
            <v-row>
              <!-- Left: choose group -->
              <v-col cols="12" md="6">
                <v-card class="pa-3">
                  <div class="text-subtitle-2 mb-2">{{ $t('studygroup.select') || '选择学习小组' }}</div>

                  <v-skeleton-loader v-if="loadingGroups" type="list-item-two-line" />
                  <v-list v-else-if="studyGroups.length" density="compact">
                    <v-list-item v-for="g in studyGroups" :key="g.id || g.groupId" @click="selectStudyGroup(g)"
                      :class="{ 'bg-grey-lighten-3': (selectedGroupId === (g.id || g.groupId)) }">
                      <v-list-item-title>
                        {{ g.name || g.title || (g.id || g.groupId) }}
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        {{ stripHtml(g.description) || g.visibility || 'group' }}
                      </v-list-item-subtitle>
                      <template #append>
                        <v-chip size="x-small" :color="isManageRole(g.role) ? 'primary' : undefined" label>
                          {{ normalizeGroupRole(g.role) }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </v-list>
                  <v-alert v-else type="info" variant="tonal" density="comfortable">
                    当前账号下没有可用学习小组
                  </v-alert>
                </v-card>
              </v-col>

              <v-divider class="d-none d-md-block" vertical />

              <!-- Right: group-plan share + cohort sessions -->
              <v-col cols="12" md="6">
                <v-card class="pa-3">
                  <div class="text-subtitle-2 mb-2">共享设置</div>

                  <v-alert v-if="!groupId" type="info" variant="tonal" class="mb-3">
                    {{ $t('studygroup.selectPrompt') }}
                  </v-alert>
                  <v-alert v-else-if="!canManageSelectedGroup" type="warning" variant="tonal" class="mb-3">
                    你是该组普通成员，无法管理“共享计划 / cohorts”
                  </v-alert>
                  <template v-else>
                    <div class="d-flex align-center mb-3">
                      <v-chip size="small" :color="isShared ? 'success' : 'default'" label>
                        {{ isShared ? '已共享到该小组' : '尚未共享到该小组' }}
                      </v-chip>
                    </div>
                    <v-select
                      v-model="shareForm.permission"
                      :items="permissionOptions"
                      label="共享权限"
                      density="compact"
                      :disabled="syncingShare"
                    />
                    <v-switch
                      v-model="shareForm.autoEnroll"
                      density="compact"
                      :label="$t('cohort.autoEnroll')"
                      :disabled="syncingShare"
                    />
                    <div class="d-flex justify-end">
                      <v-btn color="primary" :loading="syncingShare" @click="shareToGroup">
                        {{ isShared ? '更新共享设置' : '共享到此小组' }}
                      </v-btn>
                      <v-btn
                        v-if="isShared"
                        class="ml-2"
                        variant="outlined"
                        color="error"
                        :loading="unsharing"
                        @click="unshareFromGroup"
                      >
                        取消共享
                      </v-btn>
                    </div>
                  </template>
                </v-card>

                <v-card class="pa-3 mt-3">
                  <div class="text-subtitle-2 mb-2">该小组下本计划的 Cohorts</div>
                  <v-skeleton-loader v-if="loadingCohorts" type="list-item-two-line" />
                  <v-list v-else-if="cohorts.length" density="compact">
                    <v-list-item v-for="c in cohorts" :key="c.id">
                      <v-list-item-title>{{ c.title || c.id }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ c.visibility || 'group' }} | {{ c.enrollMode || 'OptIn' }} | v{{ c.pinnedVersionNumber || '-' }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                  <v-alert v-else type="info" variant="tonal" density="comfortable">
                    暂无 cohort
                  </v-alert>
                </v-card>

                <v-card class="pa-3 mt-3">
                  <div class="text-subtitle-2 mb-2">{{ $t('add') || '创建 Cohort' }}</div>
                  <v-text-field
                    v-model="createForm.title"
                    :label="$t('cohort.form.title')"
                    density="compact"
                    :disabled="!canManageSelectedGroup"
                    required
                  />
                  <v-select
                    v-model="createForm.visibility"
                    :items="['private', 'group', 'public']"
                    :label="$t('cohort.form.visibility')"
                    density="compact"
                    :disabled="!canManageSelectedGroup"
                  />
                  <v-select
                    v-model="createForm.enrollMode"
                    :items="enrollModeOptions"
                    item-title="title"
                    item-value="value"
                    label="Enrollment Mode"
                    density="compact"
                    :disabled="!canManageSelectedGroup"
                  />
                  <div class="d-flex justify-end">
                    <v-btn
                      color="primary"
                      :loading="creating"
                      :disabled="!canManageSelectedGroup || !createForm.title"
                      @click="createCohort"
                    >
                      创建 Cohort
                    </v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <v-window-item value="user">
            <em>分享给个人用户功能将对接后端分享接口（计划角色：Viewer/Editor/Owner）。</em>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="close">{{ $t('close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { apiClient } from '@/api'
import { stripHtml } from '@/utils/text'

export default {
  name: 'ShareStudyPlanDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    planId: { type: [String, Number], required: true },
    planStableId: { type: String, required: true },
  },
  data() {
    return {
      internal: this.modelValue,
      tab: 'group',

      studyGroups: [],
      loadingGroups: false,
      selectedGroupId: null,
      loadingShare: false,
      loadingCohorts: false,
      syncingShare: false,
      unsharing: false,
      creating: false,

      groupId: '',
      shareRecord: null,
      cohorts: [],

      shareForm: {
        permission: 'view',
        autoEnroll: false,
      },

      createForm: {
        title: '',
        visibility: 'group',
        enrollMode: 'OptIn',
      },

      permissionOptions: [
        { title: '只读', value: 'view' },
        { title: '可评论', value: 'comment' },
        { title: '可编辑', value: 'edit' },
        { title: '管理', value: 'admin' },
      ],
      enrollModeOptions: [
        { title: 'OptIn', value: 'OptIn' },
        { title: 'Auto', value: 'Auto' },
      ],
    }
  },
  computed: {
    selectedGroup() {
      return this.studyGroups.find((g) => String(g.id || g.groupId) === String(this.selectedGroupId)) || null
    },
    canManageSelectedGroup() {
      return !!this.groupId && this.isManageRole(this.selectedGroup?.role)
    },
    isShared() {
      return !!this.shareRecord
    },
  },
  watch: {
    modelValue(v) {
      this.internal = v
      if (v) this.fetchStudyGroups()
    },
    internal(v) {
      this.$emit('update:modelValue', v)
    },
    planId: {
      immediate: true,
      handler() {
        if (this.internal) this.refreshCurrentSelection()
      },
    },
    planStableId() {
      if (this.internal) this.refreshCurrentSelection()
    },
  },
  methods: {
    stripHtml,
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

    /** 加载可选择的 StudyGroup（按当前登录用户） */
    async fetchStudyGroups() {
      this.loadingGroups = true
      try {
        const res = await apiClient.get('/StudyGroup/GetStudyGroup')

        this.studyGroups = Array.isArray(res.data) ? res.data : []
        const manageable = this.studyGroups.find((g) => this.isManageRole(g.role))
        const selected = manageable || this.studyGroups[0] || null
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

    async selectStudyGroup(g) {
      const id = g?.id || g?.groupId
      this.selectedGroupId = id
      this.groupId = id || ''
      this.shareRecord = null
      this.cohorts = []
      if (!this.groupId) return
      await Promise.all([this.fetchShareStatus(), this.fetchCohorts()])
    },

    async fetchShareStatus() {
      if (!this.groupId || !this.planStableId) return
      this.loadingShare = true
      try {
        const res = await apiClient.get(`/StudyGroups/${this.groupId}/Plans/${this.planStableId}/Share`)
        const data = res?.data || null
        this.shareRecord = data
        this.shareForm.permission = String(data?.permission || 'view').toLowerCase()
        this.shareForm.autoEnroll = Boolean(data?.autoEnroll)
      } catch (e) {
        if (e?.response?.status === 404) {
          this.shareRecord = null
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
      if (!this.groupId || !this.planStableId) return
      this.loadingCohorts = true
      try {
        const res = await apiClient.get(`/Groups/${this.groupId}/Plans/${this.planStableId}/Cohorts`)
        this.cohorts = Array.isArray(res?.data) ? res.data : []
      } catch (e) {
        console.error('load cohorts failed', e)
        this.cohorts = []
      } finally {
        this.loadingCohorts = false
      }
    },

    async shareToGroup() {
      if (!this.planStableId || !this.groupId) return
      this.syncingShare = true
      try {
        const payload = {
          permission: this.shareForm.permission,
          autoEnroll: this.shareForm.autoEnroll,
        }
        await apiClient.post(`/StudyGroups/${this.groupId}/Plans/${this.planStableId}/Share`, payload)
        await this.fetchShareStatus()
        this.$toast?.success?.('共享设置已保存')
      } catch (e) {
        console.error('share failed', e)
        this.$toast?.error?.('共享失败，请检查权限或数据')
      } finally {
        this.syncingShare = false
      }
    },

    async unshareFromGroup() {
      if (!this.groupId || !this.planStableId) return
      this.unsharing = true
      try {
        await apiClient.delete(`/StudyGroups/${this.groupId}/Plans/${this.planStableId}`)
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
      if (!this.planStableId || !this.groupId || !this.createForm.title) return
      this.creating = true
      try {
        if (!this.isShared) {
          await this.shareToGroup()
        }

        const payload = {
          title: this.createForm.title,
          visibility: this.createForm.visibility,
          enrollMode: this.createForm.enrollMode,
        }
        await apiClient.post(`/Groups/${this.groupId}/Plans/${this.planStableId}/Cohorts`, payload)
        await this.fetchCohorts()
        this.createForm.title = ''
        this.$toast?.success?.('Cohort 创建成功')
      } catch (e) {
        console.error('create cohort failed', e)
        this.$toast?.error?.('创建 Cohort 失败')
      } finally {
        this.creating = false
      }
    },
  },
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
