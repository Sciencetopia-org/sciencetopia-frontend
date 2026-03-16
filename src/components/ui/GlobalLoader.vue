<template>
  <div v-if="isLoading" class="overlay">
    <LoadingSpinner />
  </div>
</template>

<script>
import { ref } from 'vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue' // Import the Spinner component

const isLoading = ref(false)

export function useGlobalLoading() {
  return {
    isLoading,
    showLoading: () => {
      isLoading.value = true
    },
    hideLoading: () => {
      isLoading.value = false
    },
  }
}

export default {
  components: {
    LoadingSpinner,
  },
  setup() {
    return { isLoading }
  },
}
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  /* background-color: rgba(255, 255, 255, 0.8); */
  z-index: 9999;
  pointer-events: none;
}
</style>

