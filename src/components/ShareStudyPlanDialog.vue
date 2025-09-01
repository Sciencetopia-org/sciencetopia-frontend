<template>
  <v-dialog v-model="internal" max-width="820" persistent>
    <v-card rounded="xl">
      <v-card-title>{{ $t('studyplan.share') }}</v-card-title>
      <v-card-text>
        <v-tabs v-model="tab" class="mb-2">
          <v-tab value="group">{{ $t('studygroup.studygroup') }}</v-tab>
          <v-tab value="user" disabled>用户</v-tab>
        </v-tabs>
        <v-window v-model="tab">
          <!-- Share to group via cohort + auto-enroll -->
          <v-window-item value="group">
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-3">
                  <div class="text-subtitle-2 mb-2">{{ $t('cohort.select') }}</div>
                  <v-skeleton-loader v-if="loadingCohorts" type="list-item-two-line" />
                  <v-list v-else density="compact">
                    <v-list-item
                      v-for="c in cohorts"
                      :key="c.id"
                      @click="selectCohort(c)"
                      :class="{ 'bg-grey-lighten-3': selectedCohort?.id === c.id }"
                    >
                      <v-list-item-title>{{ c.title || c.id }}</v-list-item-title>
                      <v-list-item-subtitle>{{ c.visibility || 'private' }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-3">
                  <div class="text-subtitle-2 mb-2">{{ $t('add') }}</div>
                  <v-text-field v-model="createForm.title" label="标题" density="compact" />
                  <v-select v-model="createForm.visibility" :items="['private','group','public']" label="可见性" density="compact" />
                  <v-text-field v-model="createForm.startAt" type="datetime-local" label="开始时间" density="compact" />
                  <v-text-field v-model="createForm.endAt" type="datetime-local" label="结束时间" density="compact" />
                  <div class="d-flex justify-end mt-2">
                    <v-btn color="primary" @click="createCohort" :loading="creating">创建</v-btn>
                  </div>
                </v-card>
                <v-card variant="outlined" class="pa-3 mt-3">
                  <div class="text-subtitle-2 mb-2">Auto-Enroll</div>
                  <v-text-field
                    v-model="groupId"
                    label="学习小组ID（需为该组管理者）"
                    density="compact"
                  />
                  <div class="d-flex justify-end gap-2">
                    <v-btn :disabled="!selectedCohort || !groupId" @click="enableAutoEnroll" :loading="autoEnrolling">启用</v-btn>
                    <v-btn :disabled="!selectedCohort || !groupId" color="red" variant="outlined" @click="disableAutoEnroll" :loading="autoEnrolling">停用</v-btn>
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

export default {
  name: 'ShareStudyPlanDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    planId: { type: [String, Number], required: true },
  },
  data() {
    return {
      internal: this.modelValue,
      tab: 'group',
      cohorts: [],
      selectedCohort: null,
      loadingCohorts: false,
      createForm: {
        title: '',
        visibility: 'group',
        startAt: '',
        endAt: '',
      },
      creating: false,
      groupId: '',
      autoEnrolling: false,
    }
  },
  watch: {
    modelValue(v) {
      this.internal = v
      if (v) this.fetchCohorts()
    },
    internal(v) {
      this.$emit('update:modelValue', v)
    },
    planId: {
      immediate: true,
      handler() {
        if (this.internal) this.fetchCohorts()
      },
    },
  },
  methods: {
    close() {
      this.internal = false
    },
    async fetchCohorts() {
      if (!this.planId) return
      this.loadingCohorts = true
      try {
        const res = await apiClient.get(`/studyPlans/${this.planId}/cohorts`)
        this.cohorts = Array.isArray(res.data) ? res.data : []
        this.selectedCohort = this.cohorts[0] || null
      } catch (e) {
        console.error('load cohorts failed', e)
      } finally {
        this.loadingCohorts = false
      }
    },
    selectCohort(c) {
      this.selectedCohort = c
    },
    async createCohort() {
      if (!this.planId) return
      this.creating = true
      try {
        const payload = {
          title: this.createForm.title,
          visibility: this.createForm.visibility,
          startAt: this.createForm.startAt || undefined,
          endAt: this.createForm.endAt || undefined,
        }
        await apiClient.post(`/studyPlans/${this.planId}/cohorts`, payload)
        this.createForm.title = ''
        await this.fetchCohorts()
      } catch (e) {
        console.error('create cohort failed', e)
      } finally {
        this.creating = false
      }
    },
    async enableAutoEnroll() {
      if (!this.selectedCohort?.id || !this.groupId) return
      this.autoEnrolling = true
      try {
        await apiClient.post(`/cohorts/${this.selectedCohort.id}/autoEnroll/${this.groupId}`)
        this.$toast?.success?.('已启用自动加入')
      } catch (e) {
        console.error('enable autoEnroll failed', e)
        this.$toast?.error?.('启用失败，请检查权限（需为该组管理员）')
      } finally {
        this.autoEnrolling = false
      }
    },
    async disableAutoEnroll() {
      if (!this.selectedCohort?.id || !this.groupId) return
      this.autoEnrolling = true
      try {
        await apiClient.delete(`/cohorts/${this.selectedCohort.id}/autoEnroll/${this.groupId}`)
        this.$toast?.success?.('已停用自动加入')
      } catch (e) {
        console.error('disable autoEnroll failed', e)
        this.$toast?.error?.('停用失败')
      } finally {
        this.autoEnrolling = false
      }
    },
  },
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
</style>
