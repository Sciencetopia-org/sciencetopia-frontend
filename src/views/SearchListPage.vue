<template>
  <v-container>
    <v-row>
      <v-col cols="6">
        <h3>{{ $t('search.results') }}{{ $t(':') }}{{ $t('search.tabs.knowledge') }}</h3>
        <v-container v-for="result in searchResults" :key="result.id">
          <v-card>
            <v-card-title>{{ result.properties.name }}</v-card-title>
            <v-card-text>
              {{ result.properties.description }}
            </v-card-text>
          </v-card>
        </v-container>
      </v-col>
      <v-divider vertical></v-divider>
      <v-col cols="6">
        <h3>{{ $t('search.results') }}{{ $t(':') }}{{ $t('search.tabs.resources') }}</h3>
        <v-container v-for="resource in searchResources" :key="resource.id">
          <v-card>
            <v-card-item class="link-preview-container">
              <div class="search-resource-row">
                <ResourceLearnToggle
                  :resource="resource"
                  :disabled="!canToggleResources"
                  @updated="onResourceUpdated(resource, $event)"
                  @toggle-failed="onResourceToggleFailed(resource, $event)"
                />
                <div class="search-resource-row__preview">
                  <LinkPreview :url="resource.link" />
                </div>
              </div>
            </v-card-item>
          </v-card>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { apiClient } from '@/api'
import LinkPreview from '@/components/knowledge/LinkPreview.vue' // Assuming you have a LinkPreview component
import ResourceLearnToggle from '@/components/resources/ResourceLearnToggle.vue'
import { hydrateCompletedStatuses } from '@/utils/resourceProgress'

export default {
  data() {
    return {
      searchResults: [],
      searchResources: [],
    }
  },
  components: {
    LinkPreview,
    ResourceLearnToggle,
  },
  computed: {
    canToggleResources() {
      return Boolean(this.$store.state.currentUserID || this.$store.state.userInfo?.id)
    },
  },
  mounted() {
    this.fetchSearchResults()
    this.fetchSearchResources()
  },
  methods: {
    async fetchSearchResults() {
      try {
        const query = this.$route.query.q
        this.searchResults = await apiClient
          .get('/Search/SearchKnowledgeBase', {
            params: { query: query },
          })
          .then((response) => {
            return response.data
          })
      } catch (error) {
        console.error('Failed to fetch search results:', error)
      }
    },
    async fetchSearchResources() {
      try {
        const query = this.$route.query.q
        const rawResources = await apiClient
          .get('/Search/SearchResources', {
            params: { query: query },
          })
          .then((response) => {
            return response.data
          })
        this.searchResources = (Array.isArray(rawResources) ? rawResources : []).map(resource => ({
          id: resource?.id ?? resource?.resourceId ?? resource?.ID ?? resource?.properties?.id,
          name: resource?.name ?? resource?.title ?? resource?.properties?.name ?? '',
          link: resource?.link ?? resource?.url ?? resource?.properties?.link ?? '',
          learned: false,
        }))
        await hydrateCompletedStatuses(this.searchResources)
      } catch (error) {
        console.error('Failed to fetch search results:', error)
      }
    },
    onResourceUpdated(resource, event) {
      resource.learned = event?.completed === true
    },
    onResourceToggleFailed(resource, event) {
      resource.learned = event?.completed === true
      if (event?.error) console.error('Failed to toggle search list resource completion', event.error)
    },
  },
}
</script>

<style scoped>
.search-resource-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.search-resource-row__preview {
  flex: 1 1 auto;
  min-width: 0;
}
</style>

