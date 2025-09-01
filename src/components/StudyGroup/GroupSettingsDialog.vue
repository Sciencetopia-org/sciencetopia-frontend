<template>
  <template v-if="inline">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ isManager ? '小组设置' : '我的小组设置' }}</span>
        <v-btn v-if="!inline" icon="mdi-close" variant="text" @click="close" />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <div v-if="loading"><v-skeleton-loader type="list-item" v-for="n in 4" :key="n" /></div>
        <template v-else>
          <v-alert v-if="error" type="error" class="mb-3">{{ error }}</v-alert>

          <!-- Manager settings -->
          <div v-if="isManager">
            <h3 class="text-subtitle-1 mb-2">小组资料</h3>
            <v-text-field v-model="form.profile.name" label="小组名称" density="comfortable" class="mb-2" />
            <v-textarea v-model="form.profile.bio" label="简介" rows="2" auto-grow class="mb-2" />

            <h3 class="text-subtitle-1 mt-6 mb-2">共享学习计划</h3>
            <v-table density="comfortable" class="mb-2">
              <thead>
                <tr>
                  <th class="text-left">计划</th>
                  <th class="text-left">权限</th>
                  <th class="text-left">自动入学</th>
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

            <h3 class="text-subtitle-1 mt-6 mb-2">组域 Cohorts</h3>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th class="text-left">Cohort</th>
                  <th class="text-left">所属计划</th>
                  <th class="text-left">入学模式</th>
                  <th class="text-left">固定版本</th>
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
                    <span v-else class="text-caption">未固定</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <!-- Member settings -->
          <div v-else>
            <h3 class="text-subtitle-1 mb-2">通知偏好</h3>
            <v-switch v-model="form.notifications.planUpdates" label="计划更新" hide-details density="comfortable" inset />
            <v-switch v-model="form.notifications.mentions" label="@提及" hide-details density="comfortable" inset />
            <v-switch v-model="form.notifications.rankings" label="排行榜变动" hide-details density="comfortable" inset />

            <h3 class="text-subtitle-1 mt-6 mb-2">学习与可见性</h3>
            <v-switch v-model="form.privacy.shareMetrics" label="与小组共享学习进度" hide-details density="comfortable" inset />
            <v-switch v-model="form.privacy.showOnLeaderboard" label="在排行榜显示我" hide-details density="comfortable" inset />

            <h3 class="text-subtitle-1 mt-6 mb-2">我在本组的计划</h3>
            <v-list density="compact">
              <v-list-item v-for="sp in form.myPlans" :key="sp.planId">
                <v-list-item-title>{{ sp.title }}</v-list-item-title>
                <v-list-item-subtitle>当前 Cohort：{{ sp.cohortTitle || '未加入' }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </template>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn v-if="!inline" variant="text" @click="close">关闭</v-btn>
        <v-btn color="primary" :disabled="loading" @click="save">保存</v-btn>
      </v-card-actions>
    </v-card>
  </template>
  <v-dialog v-else v-model="internalOpen" max-width="820" persistent>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ isManager ? '小组设置' : '我的小组设置' }}</span>
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <div v-if="loading"><v-skeleton-loader type="list-item" v-for="n in 4" :key="n" /></div>
        <template v-else>
          <v-alert v-if="error" type="error" class="mb-3">{{ error }}</v-alert>

          <!-- Manager settings -->
          <div v-if="isManager">
            <h3 class="text-subtitle-1 mb-2">小组资料</h3>
            <v-text-field v-model="form.profile.name" label="小组名称" density="comfortable" class="mb-2" />
            <v-textarea v-model="form.profile.bio" label="简介" rows="2" auto-grow class="mb-2" />

            <h3 class="text-subtitle-1 mt-6 mb-2">共享学习计划</h3>
            <v-table density="comfortable" class="mb-2">
              <thead>
                <tr>
                  <th class="text-left">计划</th>
                  <th class="text-left">权限</th>
                  <th class="text-left">自动入学</th>
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

            <h3 class="text-subtitle-1 mt-6 mb-2">组域 Cohorts</h3>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th class="text-left">Cohort</th>
                  <th class="text-left">所属计划</th>
                  <th class="text-left">入学模式</th>
                  <th class="text-left">固定版本</th>
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
                    <span v-else class="text-caption">未固定</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <!-- Member settings -->
          <div v-else>
            <h3 class="text-subtitle-1 mb-2">通知偏好</h3>
            <v-switch v-model="form.notifications.planUpdates" label="计划更新" hide-details density="comfortable" inset />
            <v-switch v-model="form.notifications.mentions" label="@提及" hide-details density="comfortable" inset />
            <v-switch v-model="form.notifications.rankings" label="排行榜变动" hide-details density="comfortable" inset />

            <h3 class="text-subtitle-1 mt-6 mb-2">学习与可见性</h3>
            <v-switch v-model="form.privacy.shareMetrics" label="与小组共享学习进度" hide-details density="comfortable" inset />
            <v-switch v-model="form.privacy.showOnLeaderboard" label="在排行榜显示我" hide-details density="comfortable" inset />

            <h3 class="text-subtitle-1 mt-6 mb-2">我在本组的计划</h3>
            <v-list density="compact">
              <v-list-item v-for="sp in form.myPlans" :key="sp.planId">
                <v-list-item-title>{{ sp.title }}</v-list-item-title>
                <v-list-item-subtitle>当前 Cohort：{{ sp.cohortTitle || '未加入' }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </template>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="close">关闭</v-btn>
        <v-btn color="primary" :disabled="loading" @click="save">保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { apiClient } from '@/api'

export default {
  name: 'GroupSettingsDialog',
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
      form: {
        profile: { name: '', bio: '' },
        sharedPlans: [],
        cohorts: [],
        notifications: { planUpdates: true, mentions: true, rankings: false },
        privacy: { shareMetrics: true, showOnLeaderboard: true },
        myPlans: [],
      },
      permOptions: [
        { title: '只读', value: 'Readonly' },
        { title: '评论', value: 'Comment' },
        { title: '编辑', value: 'Editable' },
        { title: '管理员', value: 'Admin' },
      ],
      enrollOptions: [
        { title: '手动加入', value: 'OptIn' },
        { title: '自动加入', value: 'Auto' },
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
      } catch (e) {
        this.error = '加载设置失败'
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
        this.error = '保存失败，请稍后重试'
      } finally {
        this.loading = false
      }
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
</style>
