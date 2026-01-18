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
              <LinkPreview :url="resource.properties.link" />
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

export default {
  data() {
    return {
      searchResults: [],
      searchResources: [],
    }
  },
  components: {
    LinkPreview,
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
        this.searchResources = await apiClient
          .get('/Search/SearchResources', {
            params: { query: query },
          })
          .then((response) => {
            return response.data
          })
      } catch (error) {
        console.error('Failed to fetch search results:', error)
      }
    },
  },
}
</script>

<style scoped>
/* Add your custom styles here */
</style>

