<template>
  <v-card>
    <v-card-title>
      <v-select
        :label="$t('knowledgeGraph.linktype')"
        v-model="linkData.type"
        :items="translatedRelationshipTypes"
        item-title="text"
        item-value="value"
        outlined
        dense
      ></v-select>
    </v-card-title>
    <v-card-actions>
      <v-btn color="primary" @click="submitLink">{{
        $t('knowledgeGraph.submitlink')
      }}</v-btn>
      <v-btn color="error" @click="cancelLinkCreation">{{
        $t('cancel')
      }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { ref, computed, getCurrentInstance } from 'vue'
import { useStore } from 'vuex'
import { apiClient } from '@/api' // Ensure this is correctly imported

export default {
  name: 'LinkCreationForm',
  setup() {
    const store = useStore()
    const { proxy } = getCurrentInstance() // Access $t

    const linkData = ref({ type: '' })

    const selectedNodes = computed(() => store.state.selectedNodes)

    // Define static relationship types
    const relationshipTypes = [
      { text: 'CONTAINS', value: 'CONTAINS' },
      { text: 'RELATES_TO', value: 'RELATES_TO' },
      { text: 'CREATE', value: 'CREATE' },
      { text: 'LEADS', value: 'LEADS' },
    ]

    // Translate the relationship types
    const translatedRelationshipTypes = computed(() =>
      relationshipTypes.map((type) => ({
        text: proxy.$t(`knowledgeGraph.linktype_items.${type.text}`),
        value: type.value,
      }))
    )

    const submitLink = async () => {
      if (selectedNodes.value.length < 2) {
        alert(proxy.$t('knowledgeGraph.selectTwoNodes'))
        return
      }
      const payload = {
        sourceNodeName: selectedNodes.value[0].name,
        targetNodeName: selectedNodes.value[1].name,
        relationshipType: linkData.value.type,
      }
      console.log('Submitting Link:', payload)
      try {
        await apiClient.post('/KnowledgeGraph/CreateRelationship', payload)
        alert(proxy.$t('knowledgeGraph.linkSubmitted'))
        linkData.value.type = '' // Reset the form
      } catch (error) {
        alert(proxy.$t('knowledgeGraph.submitFailed', { error: error.message }))
      }
    }

    const cancelLinkCreation = () => {
      if (confirm(proxy.$t('knowledgeGraph.confirmLinkCancel'))) {
        store.dispatch('toggleLinkCreationForm', false)
      }
    }

    return {
      linkData,
      translatedRelationshipTypes,
      submitLink,
      cancelLinkCreation,
    }
  },
}
</script>

<style scoped>
/* Add custom styles */
</style>
