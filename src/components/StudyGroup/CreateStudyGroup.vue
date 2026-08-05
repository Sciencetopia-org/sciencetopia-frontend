<template>
  <v-container>
    <div class="create-studygroup">
      <v-card-title class="headline">{{ $t('studygroup.create.title') }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="createGroup">
          <input
            v-model="groupName"
            :placeholder="$t('studygroup.create.placeholderName')"
            type="text"
            class="custom-input"
          />
          <!-- Tag selector: up to 10 existing tags -->
          <TagSelector
            v-model="selectedTags"
            :label="$t('tags')"
            :placeholder="$t('searchTagsPlaceholder')"
            :max="10"
            return-mode="mixed"
          />
          <!-- Placeholder for Quill Editor -->
          <div ref="quillEditor" class="quill-editor"></div>
          <v-card-actions class="sc-form-actions sc-form-actions--end create-studygroup-actions">
            <v-btn
              type="submit"
              class="sc-action-btn"
              color="primary"
              variant="flat"
              :disabled="creating"
              :loading="creating"
            >
              {{ $t('studygroup.create.create') }}
            </v-btn>
            <v-btn
              class="sc-action-btn"
              color="primary"
              variant="tonal"
              :disabled="creating"
              @click="cancel"
            >
              {{ $t('cancel') }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </div>
  </v-container>
</template>

<script>
import { apiClient } from '@/api'
import TagSelector from '@/components/common/TagSelector.vue'
import router from '@/router'
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Quill from 'quill'
import 'quill/dist/quill.snow.css' // Ensure you import Quill's CSS
import { sanitizeHtml } from '@/utils/text'

export default {
  name: 'CreateStudyGroup',
  components: { TagSelector },
  setup() {
    const { t } = useI18n()
    const groupName = ref('')
    const quillEditor = ref(null)
    const groupDescription = ref('')
    const creating = ref(false)
    const selectedTags = ref([]) // array of TagDTO objects { id, name } or plain strings for new

    // Quill editor instance
    let quillInstance

    onMounted(() => {
      quillInstance = new Quill(quillEditor.value, {
        theme: 'snow', // Specify theme
        placeholder: t('studygroup.create.placeholderDesc'), // Specify placeholder
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, 4] }], // 标题
            ['bold', 'italic', 'underline', 'strike'], // 加粗 斜体 下划线 删除线
            ['blockquote', 'code-block'], // 引用  代码块
            [{ list: 'ordered' }, { list: 'bullet' }], // 有序、无序列表
            [{ script: 'sub' }, { script: 'super' }], // 上标/下标
            [{ indent: '-1' }, { indent: '+1' }], // 缩进
            // [{ direction: 'rtl' }], // 文本方向
            [{ color: [] }, { background: [] }], // 字体颜色、字体背景颜色
            // [{ font: ['songti'] }], // 字体种类
            [{ align: [] }], // 对齐方式
            // ['clean'], // 清除文本格式
            ['link', 'image', 'video'], // 链接、图片、视频
          ],
        },
      })

      // Listen for text change to update groupDescription
      quillInstance.on('text-change', function () {
        groupDescription.value = sanitizeHtml(quillInstance.root.innerHTML)
      })
    })

    // Normalize selection: remove duplicates by id/name (case-insensitive),
    // and prefer existing tag objects over free-typed strings with same name.
    const normalizeSelection = (arr) => {
      const result = []
      const seenIds = new Set()
      const seenNames = new Set()
      for (const raw of Array.isArray(arr) ? arr : []) {
        const isObj = raw && typeof raw === 'object'
        const id = isObj ? (raw.id || raw.Id || raw.ID) : null
        const name = String(isObj ? (raw.name || raw.Name || '') : raw || '')
        const keyName = name.trim().toLowerCase()

        if (id) {
          if (seenIds.has(id)) continue
          // If a free-text with same name was already added, replace it with object
          if (keyName && seenNames.has(keyName)) {
            // remove prior free-text entry with same name
            const idx = result.findIndex(x => {
              const isObjX = x && typeof x === 'object'
              if (isObjX && (x.id || x.Id || x.ID)) return false
              const nm = String(isObjX ? (x.name || x.Name || '') : x || '')
              return nm.trim().toLowerCase() === keyName
            })
            if (idx >= 0) result.splice(idx, 1)
          }
          seenIds.add(id)
          if (keyName) seenNames.add(keyName)
          result.push({ id, name: name || String(id) })
        } else if (keyName) {
          if (seenNames.has(keyName)) continue
          seenNames.add(keyName)
          // Keep as plain string to indicate new tag
          result.push(name)
        }
      }
      return result
    }

    const createGroup = async () => {
      try {
        creating.value = true
        // Normalize and enforce up to 10 tags
        selectedTags.value = normalizeSelection(selectedTags.value)
        if (selectedTags.value.length > 10) {
          alert('每个学习小组最多可选择 10 个标签')
          return
        }
        // Separate known tag IDs and new tag names
        const ids = []
        const names = []
        const existingNamesLower = new Set()
        for (const item of selectedTags.value || []) {
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

        // Client-side duplicate check
        const seenNames = new Set()
        for (const n of names) {
          const key = n.toLowerCase()
          if (existingNamesLower.has(key) || seenNames.has(key)) {
            alert('添加的标签里有重复项：' + n)
            return
          }
          seenNames.add(key)
        }

        const payload = {
          name: groupName.value,
          description: sanitizeHtml(groupDescription.value),
          tagIds: Array.from(new Set(ids.filter(Boolean))),
          newTagNames: names.filter(Boolean),
        }
        // API call logic here
        await apiClient.post('/StudyGroup/CreateStudyGroup', payload)
        // 创建成功后的处理
        alert(t('studygroup.create.success'))
        router.push({ name: 'studyGroupList' })
      } catch (error) {
        console.error('Create study group failed:', error)
        alert(t('studygroup.create.failed'))
      } finally {
        creating.value = false
      }
    }

    // Tag searching is handled inside TagSelector

    // Remove a specific selected tag (by id or name, case-insensitive)
    const removeTag = (tag) => {
      const isObj = tag && typeof tag === 'object'
      const id = isObj ? (tag.id || tag.Id || tag.ID) : null
      const name = String(isObj ? (tag.name || tag.Name || '') : tag || '').trim().toLowerCase()
      selectedTags.value = (selectedTags.value || []).filter(x => {
        const isObjX = x && typeof x === 'object'
        const idX = isObjX ? (x.id || x.Id || x.ID) : null
        const nameX = String(isObjX ? (x.name || x.Name || '') : x || '').trim().toLowerCase()
        if (id && idX) return idX !== id
        if (id && !idX) return true
        if (!id && idX) return true
        return nameX !== name
      })
    }

    // Normalize selection and cap to 10 when user edits
    watch(selectedTags, (val) => {
      const normalized = normalizeSelection(val)
      if (normalized.length !== (val?.length || 0)) {
        selectedTags.value = normalized
        return
      }
      if (normalized.length > 10) {
        selectedTags.value = normalized.slice(0, 10)
        alert('最多选择 10 个标签')
      }
    })

    const cancel = () => {
      // Cancel logic here
      if (confirm(t('studygroup.create.cancelConfirm'))) {
        router.push({ name: 'studyGroupList' })
      }
    }

    return {
      groupName,
      quillEditor,
      selectedTags,
      
      removeTag,
      createGroup,
      cancel,
      t,
      creating,
    }
  },
}
</script>

<style>
.create-studygroup {
  background-color: #f4eee1;
  padding-left: 40px;
  padding-right: 40px;
  padding-top: 20px;
  padding-bottom: 20px;
  box-shadow: -8px 4px 8px 0px rgba(0, 0, 0, 0.05) !important;
}

/* Custom styles for the standard HTML input */
.custom-input {
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.quill-editor {
  height: 400px;
  /* Adjust based on your needs */
}

.create-studygroup-actions {
  margin-top: 16px;
}
</style>
