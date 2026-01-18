<template>
  <v-card class="group-overview">
    <v-card-title>
      {{ group.name }}
      <v-btn v-if="isManager" icon variant="text" @click="enterEditMode">✏️</v-btn>
    </v-card-title>
    <div v-if="loading" class="pa-4">
      <LoadingSpinner />
    </div>

    <!-- Display Mode -->
    <div v-show="!isEditMode && !loading">
      <v-card-subtitle>
        <div v-if="group.description" v-html="sanitizeHtml(group.description)"></div>
        <div v-else>{{ $t('studygroup.groupdescription') }}: -</div>
      </v-card-subtitle>
      <TagChips :items="tags" root-class="mt-2 px-4 pb-2" />
      <v-img :src="group.imageUrl || defaultImage" aspect-ratio="16/9"></v-img>
    </div>

    <!-- Edit Mode -->
    <div v-show="isEditMode && !loading" class="pa-4">
      <v-form>
        <v-text-field v-model="groupName" :label="$t('groupSettings.name')"></v-text-field>
        <div class="mb-2 text-subtitle-2">{{ $t('studygroup.groupdescription') }}</div>
        <div ref="quillEditor" class="quill-editor"> </div>
        <TagSelector
          v-model="selectedTags"
          :label="$t('tags')"
          :placeholder="$t('searchTagsPlaceholder')"
          :max="10"
          return-mode="mixed"
        />
        <v-card-actions>
          <v-btn color="primary" :loading="saving" :disabled="saving" @click="saveSettings">{{ $t('savesetting') }}</v-btn>
          <v-btn color="red" @click="cancelEditMode">{{ $t('cancel') }}</v-btn>
        </v-card-actions>
      </v-form>
    </div>
  </v-card>
</template>

<script>
 import { apiClient } from '@/api'
 import Quill from 'quill'
 import 'quill/dist/quill.snow.css'
 import TagSelector from '@/components/common/TagSelector.vue'
 import TagChips from '@/components/common/TagChips.vue'
 import { sanitizeHtml } from '@/utils/text'

export default {
  components: { LoadingSpinner: require('@/components/ui/LoadingSpinner.vue').default, TagSelector, TagChips },
  props: {
    groupId: String,
  },
  data() {
    return {
      isEditMode: false,
      group: {},
      groupName: '',
      groupDescription: '',
      loading: true,
      saving: false,
      isManager: false,
      tags: [],
      selectedTags: [],
      // tagOptions/tagSearch/loadingTags removed; TagSelector handles searching
      defaultImage: require('@/assets/images/default_study_group.png'),
      quillInstance: null,
    }
  },
  async mounted() {
    await this.fetchGroupData()
    await this.fetchRole()
    await this.fetchTags()
    this.loading = false
    // Initialize quill like CreateStudyGroup on mount
    if (this.$refs.quillEditor && !this.quillInstance) {
      this.quillInstance = new Quill(this.$refs.quillEditor, {
        theme: 'snow',
        placeholder: this.$t('studygroup.create.placeholderDesc'),
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, 4] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            ['link', 'image', 'video'],
          ],
        },
      })
      this.quillInstance.root.innerHTML = this.groupDescription || this.group?.description || ''
      this.quillInstance.on('text-change', () => {
        this.groupDescription = this.quillInstance.root.innerHTML
      })
    }
  },
  methods: {
    initQuillIfNeeded() {},
    sanitizeHtml,
    async fetchGroupData() {
      const response = await apiClient.get(
        `/StudyGroup/GetStudyGroupById/${this.groupId}`
      )
      this.group = response.data
      this.groupName = this.group.name
      this.groupDescription = this.group.description
    },
    async fetchRole() {
      try {
        const resp = await apiClient.get(`/StudyGroup/GetUserRoleInGroup/${this.groupId}`)
        this.isManager = String(resp?.data || '').toLowerCase() === 'manager'
      } catch (_) {
        this.isManager = false
      }
    },
    async fetchTags() {
      try {
        const resp = await apiClient.get(`/StudyGroup/Tags/${this.groupId}`)
        const list = Array.isArray(resp?.data) ? resp.data : []
        this.tags = list
        // Preload for edit mode
        this.selectedTags = list.map(x => ({ id: x.id || x.Id, name: x.name || x.Name }))
      } catch (e) {
        this.tags = []
      }
    },
    enterEditMode() {
      this.isEditMode = true
      if (this.quillInstance) {
        this.quillInstance.root.innerHTML = this.groupDescription || this.group?.description || ''
      }
    },
    async saveSettings() {
      try {
        this.saving = true
        // Pull HTML from Quill if present
        if (this.quillInstance) {
          this.groupDescription = this.quillInstance.root.innerHTML
        }
        // 1) Rename if changed
        if ((this.groupName || '') !== (this.group?.name || '')) {
          await apiClient.post(`/StudyGroupManage/RenameGroup/${this.groupId}`, { newName: this.groupName })
        }
        // 2) Update description if changed (HTML allowed)
        if ((this.groupDescription || '') !== (this.group?.description || '')) {
          await apiClient.post(`/StudyGroupManage/EditDescription/${this.groupId}`, { newDescription: this.groupDescription })
        }
        // 3) Update tags
        const ids = []
        const names = []
        const existingNamesLower = new Set()
        for (const item of this.selectedTags || []) {
          if (item && typeof item === 'object' && item.id) {
            ids.push(item.id)
            const nm = String(item.name || '').trim().toLowerCase()
            if (nm) existingNamesLower.add(nm)
          } else if (typeof item === 'string') {
            names.push(item.trim())
          } else if (item && typeof item === 'object' && !item.id && item.name) {
            names.push(String(item.name).trim())
          }
        }
        // Cap to 10 client-side
        const total = new Set(ids).size + new Set(names.map(s => s.toLowerCase())).size
        if (total > 10) {
          alert('每个学习小组最多可添加 10 个标签')
          return
        }
        await apiClient.post(`/StudyGroupManage/UpdateTags/${this.groupId}`, {
          tagIds: Array.from(new Set(ids.filter(Boolean))),
          newTagNames: names.filter(Boolean)
        })

        alert(this.$t('groupSettings.saveSuccess'))
        this.isEditMode = false
        await this.fetchGroupData()
        await this.fetchTags()
      } catch (e) {
        alert(this.$t('groupSettings.saveFailed') || '保存失败')
      } finally {
        this.saving = false
      }
    },
    cancelEditMode() {
      this.isEditMode = false
      this.groupName = this.group.name // Reset fields
      this.groupDescription = this.group.description
      // reset selectedTags
      this.selectedTags = (this.tags || []).map(x => ({ id: x.id || x.Id, name: x.name || x.Name }))
      // Destroy editor to avoid duplicates
      if (this.quillInstance) {
        // Quill has no explicit destroy API; remove DOM content and deref
        this.quillInstance = null
      }
    },
    // Tag search removed; TagSelector encapsulates it
  },
  watch: {}
}
</script>

<style scoped>
.group-overview {
  max-width: 1200px;
  margin: auto;
  background-color: unset !important;
}

.quill-editor {
  height: 400px;
}
</style>

