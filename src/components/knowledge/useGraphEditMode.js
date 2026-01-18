// useGraphEditMode.js
import { computed } from 'vue'
import { useStore } from 'vuex'

export function useGraphEditMode() {
  const store = useStore()

  // Computed property to get the isEditing state from the store
  const isEditing = computed(() => store.state.isEditing)

  // Method to toggle the isEditing state
  const toggleEditMode = () => {
    store.dispatch('toggleEditMode')
  }

  return { isEditing, toggleEditMode }
}
