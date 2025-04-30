<template>
  <div class="result-item" @click="$emit('click', result)">
    <div class="result-title">{{ result.title }}</div>
    <div class="result-excerpt">{{ result.excerpt }}</div>
    <div class="result-meta">
      <v-chip small>{{ typeLabel }}</v-chip>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  props: {
    result: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const typeLabel = computed(() => {
      const labels = {
        knowledge: '知识',
        plan: '计划',
        group: '小组'
      }
      return labels[props.result.type] || props.result.type
    })

    return { typeLabel }
  }
}
</script>

<style scoped>
.result-item {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.result-item:hover {
  background: #f5f5f5;
}

.result-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.result-excerpt {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 4px;
}

.result-meta {
  display: flex;
  justify-content: flex-end;
}
</style>