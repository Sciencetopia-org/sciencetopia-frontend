<template>
  <v-card>
    <v-card-title>
      <v-select
        :label="$t('knowledgeGraph.node.type')"
        v-model="nodeData.label"
        :items="translatedNodeTypes"
        item-title="text"
        item-value="value"
        outlined
        dense
      ></v-select>
      <v-text-field
        :label="$t('knowledgeGraph.node.name')"
        v-model="nodeData.name"
        outlined
        dense
      ></v-text-field>
    </v-card-title>
    <v-card-text>
      <v-textarea
        :label="$t('knowledgeGraph.node.description')"
        v-model="nodeData.description"
        outlined
        dense
      ></v-textarea>
    </v-card-text>

    <!-- Dynamic inputs for resources -->
    <v-card-text v-for="(url, index) in nodeData.urls" :key="index">
      <v-row align="center" no-gutters>
        <v-col cols="11">
          <v-text-field
            class="flex-grow-1"
            :label="$t('knowledgeGraph.node.resource')"
            v-model="url.link"
            outlined
            dense
          ></v-text-field>
        </v-col>
        <v-col cols="1">
          <v-btn
            variant="text"
            icon
            @click.prevent="removeUrl(index)"
            v-if="nodeData.urls.length > 1"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-actions>
      <v-btn @click="addUrl">
        <v-icon left>mdi-plus</v-icon>{{ $t('knowledgeGraph.addResource') }}
      </v-btn>
    </v-card-actions>

    <v-card-actions>
      <v-btn color="primary" @click="submitNode">{{
        $t('knowledgeGraph.submitnode')
      }}</v-btn>
      <v-btn color="error" @click="cancelNodeCreation">{{
        $t('cancel')
      }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { ref, computed, getCurrentInstance } from 'vue'
import { useStore } from 'vuex'
import { apiClient } from '@/api'

export default {
  name: 'NodeCreationForm',
  setup() {
    const store = useStore()
    const { proxy } = getCurrentInstance() // Access $t for translations

    const nodeData = ref({
      label: '',
      name: '',
      description: '',
      urls: [{ link: '' }], // Initialize with an empty resource field
    })

    // Define static node types
    const nodeTypes = [
      { text: 'Discipline', value: 'Discipline' },
      { text: 'Subject', value: 'Subject' },
      { text: 'Field', value: 'Field' },
      { text: 'Topic', value: 'Topic' },
      { text: 'Keyword', value: 'Keyword' },
    ]

    // Translate the node types
    const translatedNodeTypes = computed(() =>
      nodeTypes.map((type) => ({
        text: proxy.$t(`knowledgeGraph.nodetype_items.${type.text}`),
        value: type.value,
      }))
    )

    const addUrl = () => {
      nodeData.value.urls.push({ link: '' })
    }

    const removeUrl = (index) => {
      nodeData.value.urls.splice(index, 1)
    }

    const submitNode = async () => {
      console.log('Submitting Node:', nodeData.value)
      try {
        await apiClient.post('/KnowledgeGraph/CreateNode', {
          label: nodeData.value.label,
          name: nodeData.value.name,
          description: nodeData.value.description,
          link: nodeData.value.urls.map((u) => u.link),
        })
        alert(proxy.$t('knowledgeGraph.nodeSubmitted')) // Use translation
        nodeData.value = {
          label: '',
          name: '',
          description: '',
          urls: [{ link: '' }],
        } // Reset form
      } catch (error) {
        alert(proxy.$t('knowledgeGraph.submitFailed', { error: error.message })) // Use translation
      }
    }

    const cancelNodeCreation = () => {
      if (confirm(proxy.$t('knowledgeGraph.confirmCancel'))) {
        store.dispatch('toggleNodeCreationForm', false) // Assuming this toggles the form visibility
      }
    }

    return {
      nodeData,
      translatedNodeTypes,
      addUrl,
      removeUrl,
      submitNode,
      cancelNodeCreation,
    }
  },
}
</script>

<style scoped>
.v-menu__content--active {
  visibility: visible !important;
  display: block !important;
  z-index: 99999 !important;
  /* Ensure it's on top of full-screen overlay */
  position: absolute !important;
}
</style>
