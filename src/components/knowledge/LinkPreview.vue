<template>
  <div>
    <LoadingSpinner v-if="isLoading" />
    <a
      v-else-if="preview"
      :href="safeUrl(preview.url)"
      target="_blank" rel="noopener noreferrer" class="link-preview"
    >
      <h3 class="preview-title">{{ preview.title || preview.url }}</h3>
      <img v-if="safeUrl(preview.image, '')" :src="safeUrl(preview.image, '')" alt="preview" class="preview-image" />
      <p v-if="preview.description">{{ preview.description }}</p>
    </a>
  </div>
</template>

<script>
import { fetchLinkPreview } from '@/services/linkPreviewService'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue' // Import the Spinner component
import { safeUrl } from '@/utils/text'

export default {
  name: 'LinkPreview',
  components: {
    LoadingSpinner,
  },
  props: {
    url: String,
  },
  data() {
    return {
      preview: null,
      isLoading: false, // Add a loading state
    }
  },
  created() {
    this.loadPreview()
  },
  methods: {
    safeUrl,
    async loadPreview() {
      this.isLoading = true // Set loading to true when fetching starts
      try {
        this.preview = await fetchLinkPreview(this.url)
      } catch (error) {
        console.error('Error fetching link preview:', error)
      } finally {
        this.isLoading = false // Set loading to false when fetching ends
      }
    },
  },
}
</script>


