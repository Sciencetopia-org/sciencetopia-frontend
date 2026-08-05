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
    <div v-if="!isEditMode && !loading">
      <v-card-subtitle>
        <div v-if="group.description" v-html="sanitizeHtml(group.description)"></div>
        <div v-else>{{ $t('studygroup.groupdescription') }}: -</div>
      </v-card-subtitle>
      <TagChips :items="tags" root-class="mt-2 px-4 pb-2" />
      <v-img :src="group.imageUrl || defaultImage" aspect-ratio="16/9"></v-img>
    </div>

    <!-- Edit Mode -->
    <div v-else-if="isEditMode && !loading" class="pa-4">
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
 import 'quill/dist/quill.snow.css'
 import TagSelector from '@/components/common/TagSelector.vue'
 import TagChips from '@/components/common/TagChips.vue'
 import { sanitizeHtml } from '@/utils/text'

 let QuillCtor = null

export default {
  components: { LoadingSpinner: require('@/components/ui/LoadingSpinner.vue').default, TagSelector, TagChips },
  props: {
    groupId: [String, Number],
    initialGroup: { type: Object, default: () => ({}) },
    initialTags: { type: Array, default: () => [] },
    initialRole: { type: String, default: '' },
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
    if (this.hydrateFromProps()) {
      this.fetchTags()
      this.loading = false
      return
    }

    await this.fetchGroupData()
    this.fetchTags()
    this.loading = false
  },
  methods: {
    initQuillIfNeeded() {},
    sanitizeHtml,
    hydrateFromProps() {
      const incomingGroup = this.initialGroup && Object.keys(this.initialGroup).length > 0
        ? this.initialGroup
        : null

      if (!incomingGroup) {
        return false
      }

      this.group = { ...incomingGroup }
      this.tags = Array.isArray(this.initialTags) ? [...this.initialTags] : []
      const role = String(this.initialRole || '').toLowerCase()
      this.isManager = role === 'owner' || role === 'admin' || role === 'manager'
      this.groupName = this.group.name || ''
      this.groupDescription = this.group.description || ''
      return true
    },
    async ensureEditorReady() {
      if (this.quillInstance || !this.$refs.quillEditor) {
        if (this.quillInstance) {
          this.quillInstance.root.innerHTML = sanitizeHtml(this.groupDescription || this.group?.description || '')
        }
        return
      }

      if (!QuillCtor) {
        const quillModule = await import('quill')
        QuillCtor = quillModule.default
      }

      this.quillInstance = new QuillCtor(this.$refs.quillEditor, {
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
      this.quillInstance.root.innerHTML = sanitizeHtml(this.groupDescription || this.group?.description || '')
      this.quillInstance.on('text-change', () => {
        this.groupDescription = sanitizeHtml(this.quillInstance.root.innerHTML)
      })
    },
    async fetchGroupData() {
      try {
        const response = await apiClient.get(`/StudyGroup/Bootstrap/${this.groupId}`)
        const payload = response?.data || {}
        this.group = payload.group || {}
        this.tags = Array.isArray(payload.tags) ? payload.tags : []
        const role = String(payload.role || '').toLowerCase()
        this.isManager = role === 'owner' || role === 'admin' || role === 'manager'
        this.groupName = this.group.name || ''
        this.groupDescription = this.group.description || ''
      } catch (error) {
        this.group = {}
        this.groupName = ''
        this.groupDescription = ''
        console.error('Failed to fetch study group details:', error)
      }
    },
    async fetchRole() {
      return
    },
    async fetchTags() {
      this.selectedTags = (this.tags || []).map(x => ({ id: x.id || x.Id, name: x.name || x.Name }))
    },
    async enterEditMode() {
      this.isEditMode = true
      await this.$nextTick()
      await this.ensureEditorReady()
    },
    async saveSettings() {
      try {
        this.saving = true
        // Pull HTML from Quill if present
        if (this.quillInstance) {
          this.groupDescription = sanitizeHtml(this.quillInstance.root.innerHTML)
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
  watch: {
    initialGroup: {
      deep: true,
      handler() {
        if (!this.loading) {
          this.hydrateFromProps()
        }
      },
    },
    initialTags: {
      deep: true,
      handler(tags) {
        if (!this.loading) {
          this.tags = Array.isArray(tags) ? [...tags] : []
          this.fetchTags()
        }
      },
    },
    initialRole(role) {
      if (!this.loading) {
        const normalized = String(role || '').toLowerCase()
        this.isManager = normalized === 'owner' || normalized === 'admin' || normalized === 'manager'
      }
    },
  }
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

