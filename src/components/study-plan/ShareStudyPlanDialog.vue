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
          <!-- Share to group via cohort + auto-enroll -->
          <v-window-item value="group">
            <v-row>
              <!-- 左列：选择 StudyGroup -->
              <v-col cols="12" md="6">
                <v-card class="pa-3">
                  <div class="text-subtitle-2 mb-2">{{ $t('studygroup.select') || '选择学习小组' }}</div>

                  <v-skeleton-loader v-if="loadingGroups" type="list-item-two-line" />
                  <v-list v-else density="compact">
                    <v-list-item v-for="g in studyGroups" :key="g.id || g.groupId" @click="selectStudyGroup(g)"
                      :class="{ 'bg-grey-lighten-3': (selectedGroupId === (g.id || g.groupId)) }">
                      <v-list-item-title>{{ g.name || g.title || (g.id || g.groupId) }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ stripHtml(g.description) || g.visibility || 'group' }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-col>

              <v-divider class="d-none d-md-block" vertical />

              <!-- 右列：当前 StudyGroup 下的 Cohort 管理 -->
              <v-col cols="12" md="6">
                <v-card class="pa-3">
                  <div class="text-subtitle-2 mb-2">{{ $t('add') || '创建 Cohort' }}</div>

                  <v-alert v-if="!groupId" type="info" variant="tonal" class="mb-3">
                    {{ $t('studygroup.selectPrompt') }}
                  </v-alert>

                  <v-text-field v-model="createForm.title" :label="$t('cohort.form.title')" density="compact" :disabled="!groupId" required />
                  <v-select v-model="createForm.visibility" :items="['private', 'group', 'public']" :label="$t('cohort.form.visibility')"
                    density="compact" :disabled="!groupId" />
                  <v-text-field v-model="createForm.startAt" type="datetime-local" :label="$t('cohort.form.startAt')" density="compact"
                    :disabled="!groupId" />
                  <v-text-field v-model="createForm.endAt" type="datetime-local" :label="$t('cohort.form.endAt')" density="compact"
                    :disabled="!groupId" />

                  <v-alert v-if="createdCohortId" type="success" variant="tonal" class="mt-3">
                    {{ $t('studygroup.sharedToGroup') }}
                    <!-- 已创建 Cohort：{{ createdCohortId }} -->
                  </v-alert>
                </v-card>

                <v-card class="pa-3 mt-3">
                  <v-switch v-model="autoEnrollEnabled" :disabled="!canToggleAutoEnroll" :loading="autoEnrolling"
                    :label="$t('cohort.autoEnroll')" @change="toggleAutoEnroll" color="primary" />
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
        <v-btn color="primary" @click="createCohort" :loading="creating"
          :disabled="!groupId || !createForm.title">分享</v-btn>
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

      // StudyGroup 列表与状态
      studyGroups: [],
      loadingGroups: false,
      selectedGroupId: null,

      createForm: {
        title: '',
        visibility: 'group',
        startAt: '',
        endAt: '',
      },
      creating: false,
      groupId: '',

      // 新增：记录刚创建出来的 CohortId
      createdCohortId: '',

      autoEnrolling: false,
      autoEnrollEnabled: false,
    }
  },
  computed: {
    // 只要选择了 group 且标题非空，并且当前不在 auto-enrolling，就允许切换开关
    canToggleAutoEnroll() {
      return !!this.groupId && !!this.createForm.title && !this.autoEnrolling
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
        if (this.internal) this.fetchStudyGroups()
      },
    },
  },
  methods: {
    stripHtml,
    close() {
      this.internal = false
    },

    /** 加载可选择的 StudyGroup（通过 targetUserId） */
    async fetchStudyGroups() {
      this.loadingGroups = true
      try {
        const uid = this.$store.state.currentUserID

        if (!uid) {
          console.warn('无法从 store 读取当前用户 id（targetUserId）')
          this.studyGroups = []
          return
        }

        const res = await apiClient.get('/StudyGroup/GetStudyGroup', {
          params: { targetUserId: uid },
        })

        this.studyGroups = Array.isArray(res.data) ? res.data : []
        // 默认不自动选中、不创建任何 cohort
        this.selectedGroupId = null
        this.groupId = ''
        this.createdCohortId = ''
        this.autoEnrollEnabled = false
      } catch (e) {
        console.error('load study groups failed', e)
      } finally {
        this.loadingGroups = false
      }
    },

    /** 选择 StudyGroup（不再加载 cohorts） */
    selectStudyGroup(g) {
      const id = g?.id || g?.groupId
      this.selectedGroupId = id
      this.groupId = id || ''
      // 切换小组后清空“刚创建”的 cohort 状态
      this.createdCohortId = ''
      this.autoEnrollEnabled = false
    },

    /** 仅创建 Cohort（返回 id 后记录到 createdCohortId） */
    async createCohort() {
      if (!this.planStableId || !this.groupId) return
      this.creating = true
      try {
        const payload = {
          title: this.createForm.title,
          visibility: this.createForm.visibility,
          startAt: this.createForm.startAt || undefined,
          endAt: this.createForm.endAt || undefined,
        }
        const res = await apiClient.post(
          `/Groups/${this.groupId}/Plans/${this.planStableId}/Cohorts`,
          payload
        )

        // 兼容不同返回结构，尽量拿到 id
        const created = res?.data || {}
        this.createdCohortId = created.id || created.cohortId || created.Id || ''

        this.$toast?.success?.('Cohort 创建成功')

        // 如果用户在创建前就打开了“自动加入”，这里为新建的 cohort 自动启用
        if (this.autoEnrollEnabled && this.createdCohortId) {
          this.autoEnrolling = true
          try {
            await apiClient.post(`/Cohorts/${this.createdCohortId}/AutoEnroll/${this.groupId}`)
            this.$toast?.success?.('已为新建 Cohort 启用自动加入')
          } catch (e) {
            console.error('auto-enroll after create failed', e)
            this.$toast?.error?.('自动加入启用失败，请检查权限')
            // 失败时可选择把开关回退
            this.autoEnrollEnabled = false
          } finally {
            this.autoEnrolling = false
          }
        }

        // 重置表单，但保留可见性设置
        this.createForm.title = ''
        this.createForm.startAt = ''
        this.createForm.endAt = ''
      } catch (e) {
        console.error('create cohort failed', e)
        this.$toast?.error?.('创建失败')
      } finally {
        this.creating = false
      }
    },

    /** 仅针对“刚创建的 Cohort”切换 Auto-Enroll */
    async toggleAutoEnroll(value) {
      // 还没创建 cohort 时：只记录意图，不调用后端
      if (!this.createdCohortId) {
        return
      }
      if (!this.groupId) return

      this.autoEnrolling = true
      try {
        if (value) {
          await apiClient.post(`/Cohorts/${this.createdCohortId}/AutoEnroll/${this.groupId}`)
          this.$toast?.success?.('已启用自动加入')
        } else {
          await apiClient.delete(`/Cohorts/${this.createdCohortId}/AutoEnroll/${this.groupId}`)
          this.$toast?.success?.('已停用自动加入')
        }
      } catch (e) {
        console.error('toggle autoEnroll failed', e)
        this.$toast?.error?.(value ? '启用失败，请检查权限（需为该组管理员）' : '停用失败')
        this.autoEnrollEnabled = !value // 回退 UI
      } finally {
        this.autoEnrolling = false
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
