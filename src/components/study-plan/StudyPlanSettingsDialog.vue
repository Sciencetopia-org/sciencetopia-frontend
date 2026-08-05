<template>
  <v-dialog
    v-model="internalOpen"
    :fullscreen="isMobile"
    max-width="1040"
    persistent
    scrollable
  >
    <v-card class="plan-settings-card" rounded="xl">
      <v-card-title class="plan-settings-title">
        <div>
          <div class="text-h6">{{ $t('studyplan.settings.title') }}</div>
          <div class="text-caption text-medium-emphasis">{{ planTitle }}</div>
        </div>
        <v-btn icon="mdi-close" variant="text" :disabled="busy" @click="close" />
      </v-card-title>
      <v-divider />

      <div class="plan-settings-layout">
        <v-tabs
          v-model="activeTab"
          class="plan-settings-tabs"
          :direction="isMobile ? 'horizontal' : 'vertical'"
          color="primary"
        >
          <v-tab value="edit" prepend-icon="mdi-pencil">
            {{ $t('edit') }}
          </v-tab>
          <v-tab value="delete" prepend-icon="mdi-delete-outline">
            {{ $t('delete') }}
          </v-tab>
        </v-tabs>

        <v-divider :vertical="!isMobile" />

        <v-card-text class="plan-settings-body">
          <v-window v-model="activeTab">
            <v-window-item value="edit">
              <v-alert
                v-if="!canEdit"
                type="warning"
                variant="tonal"
                density="comfortable"
                class="mb-4"
              >
                {{ $t('studyplan.dialogs.noEditPermissionShort') }}
              </v-alert>
              <EditStudyPlanForm
                v-if="plan && canEdit"
                ref="editForm"
                :studyPlan="plan"
                :saving="saving"
                :showTopSave="false"
                @save="$emit('save', $event)"
                @dirty="$emit('dirty')"
              />
            </v-window-item>

            <v-window-item value="delete">
              <div class="delete-panel">
                <v-alert type="error" variant="tonal" class="mb-4">
                  {{ $t('studyplan.settings.deleteWarning') }}
                </v-alert>
                <p class="text-body-2 text-medium-emphasis mb-3">
                  {{ $t('studyplan.settings.confirmNamePrompt') }}
                </p>
                <v-text-field
                  v-model="confirmName"
                  :label="$t('studyplan.title')"
                  variant="outlined"
                  color="red"
                  :disabled="busy || !canDelete"
                />
                <v-alert
                  v-if="!canDelete"
                  type="warning"
                  variant="tonal"
                  density="comfortable"
                  class="mb-4"
                >
                  {{ $t('studyplan.settings.noDeletePermission') }}
                </v-alert>
                <v-btn
                  color="red"
                  variant="flat"
                  prepend-icon="mdi-delete-outline"
                  :loading="deleting"
                  :disabled="!deleteConfirmed || busy || !canDelete"
                  @click="deletePlan"
                >
                  {{ $t('studyplan.settings.deleteAction') }}
                </v-btn>
              </div>
            </v-window-item>
          </v-window>
        </v-card-text>
      </div>

      <v-divider />
      <v-card-actions class="plan-settings-actions">
        <v-spacer />
        <v-btn variant="text" :disabled="busy" @click="close">{{ $t('close') }}</v-btn>
        <v-btn
          v-if="activeTab === 'edit' && canEdit"
          color="primary"
          :loading="saving"
          :disabled="busy"
          @click="saveEdit"
        >
          {{ $t('save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { apiClient } from '@/api'
import EditStudyPlanForm from '@/components/study-plan/EditStudyPlanForm.vue'
import { isPhoneDevice, phoneDeviceRevision } from '@/utils/device'

export default {
  name: 'StudyPlanSettingsDialog',
  components: { EditStudyPlanForm },
  props: {
    modelValue: { type: Boolean, default: false },
    plan: { type: Object, default: null },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    saving: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'save', 'deleted', 'dirty'],
  data() {
    return {
      internalOpen: this.modelValue,
      activeTab: 'edit',
      confirmName: '',
      deleting: false,
    }
  },
  computed: {
    isMobile() {
      phoneDeviceRevision.value
      return isPhoneDevice()
    },
    busy() {
      return this.saving || this.deleting
    },
    planTitle() {
      return String(this.plan?.title || '')
    },
    deleteConfirmed() {
      return this.confirmName.trim() === this.planTitle.trim()
    },
  },
  watch: {
    modelValue(value) {
      this.internalOpen = value
      if (value) this.reset()
    },
    internalOpen(value) {
      this.$emit('update:modelValue', value)
    },
    plan() {
      this.reset()
    },
  },
  methods: {
    reset() {
      this.activeTab = 'edit'
      this.confirmName = ''
      this.deleting = false
    },
    close() {
      if (this.busy) return
      this.internalOpen = false
    },
    saveEdit() {
      this.$refs.editForm?.saveStudyPlan?.()
    },
    async deletePlan() {
      if (!this.planTitle || !this.deleteConfirmed || !this.canDelete || this.busy) return
      this.deleting = true
      try {
        await apiClient.delete('/StudyPlan/DeleteStudyPlan', {
          params: { studyPlanTitle: this.planTitle },
        })
        this.$emit('deleted', this.plan)
        this.internalOpen = false
      } catch (error) {
        console.error('Failed to delete study plan:', error)
        alert(this.$t('studyplan.deletefailed'))
      } finally {
        this.deleting = false
      }
    },
  },
}
</script>

<style scoped>
.plan-settings-card {
  display: flex;
  flex-direction: column;
  max-height: min(calc(100dvh - 48px), 900px);
  overflow: hidden;
}

.plan-settings-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.plan-settings-layout {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.plan-settings-tabs {
  flex: 0 0 176px;
  padding: 12px 8px;
}

.plan-settings-body {
  flex: 1 1 auto;
  min-width: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.plan-settings-actions {
  flex: 0 0 auto;
}

.delete-panel {
  max-width: 640px;
}

:global(body.phone-layout) .plan-settings-card {
  height: 100dvh;
  max-height: 100dvh;
  border-radius: 16px !important;
}

:global(body.phone-layout) .plan-settings-layout {
  flex-direction: column;
}

:global(body.phone-layout) .plan-settings-tabs {
  flex: 0 0 auto;
  padding: 0 8px;
}

:global(body.phone-layout) .plan-settings-body {
  min-height: 0;
}

:global(body.phone-layout) .plan-settings-actions {
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
}
</style>
