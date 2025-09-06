<template>
  <!-- Display Mode -->
  <v-card class="group-overview" v-if="!isEditMode">
    <v-card-title>
      {{ group.name }}
      <v-btn icon variant="text" @click="enterEditMode">✏️</v-btn>
    </v-card-title>
    <v-card-subtitle>{{ group.description }}</v-card-subtitle>
    <v-img :src="group.imageUrl || defaultImage" aspect-ratio="16/9"></v-img>
  </v-card>

  <!-- Edit Mode -->
  <v-card class="group-settings" v-else>
    <v-card-title>{{ $t('groupSettings.titleManager') }}</v-card-title>
    <v-card-text>
      <v-form>
        <v-text-field v-model="groupName" :label="$t('groupSettings.name')"></v-text-field>
        <v-textarea v-model="groupDescription" :label="$t('studygroup.groupdescription')"></v-textarea>
        <v-file-input
          v-model="groupImage"
          :label="$t('studygroup.groupbanner')"
          accept="image/*"
        ></v-file-input>
        <v-card-actions>
          <v-btn color="primary" @click="saveSettings">{{ $t('savesetting') }}</v-btn>
          <v-btn color="red" @click="cancelEditMode">{{ $t('cancel') }}</v-btn>
        </v-card-actions>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script>
import { apiClient } from '@/api'

export default {
  props: {
    groupId: String,
  },
  data() {
    return {
      isEditMode: false,
      group: {},
      groupName: '',
      groupDescription: '',
      groupImage: null,
      defaultImage: require('@/assets/images/default_study_group.png'),
    }
  },
  async mounted() {
    await this.fetchGroupData()
  },
  methods: {
    async fetchGroupData() {
      const response = await apiClient.get(
        `/StudyGroup/GetStudyGroupById/${this.groupId}`
      )
      this.group = response.data
      this.groupName = this.group.name
      this.groupDescription = this.group.description
    },
    enterEditMode() {
      this.isEditMode = true
    },
    async saveSettings() {
      const formData = new FormData()
      formData.append('name', this.groupName)
      formData.append('description', this.groupDescription)
      if (this.groupImage) {
        formData.append('image', this.groupImage)
      }

      await apiClient.post(
        `/StudyGroupManage/UpdateGroupSettings/${this.groupId}`,
        formData
      )
      alert(this.$t('groupSettings.saveSuccess'))
      this.isEditMode = false
      await this.fetchGroupData() // Refresh the group data after saving
    },
    cancelEditMode() {
      this.isEditMode = false
      this.groupName = this.group.name // Reset fields
      this.groupDescription = this.group.description
      this.groupImage = null // Clear file input
    },
  },
}
</script>

<style scoped>
.group-overview,
.group-settings {
  max-width: 1200px;
  margin: auto;
  background-color: unset !important;
}
</style>
