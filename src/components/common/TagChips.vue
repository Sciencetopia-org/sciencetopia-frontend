<template>
  <div class="tag-chips" :class="rootClass">
    <v-chip
      v-for="(t, idx) in normalized"
      :key="keyFor(t, idx)"
      class="ma-1"
      :size="size"
      label
      :color="color"
      :variant="variant"
    >
      {{ titleOf(t) }}
    </v-chip>
  </div>
</template>

<script>
export default {
  name: 'TagChips',
  props: {
    items: { type: Array, default: () => [] },
    itemTitle: { type: String, default: 'name' },
    itemValue: { type: String, default: 'id' },
    size: { type: String, default: 'small' },
    color: { type: String, default: undefined },
    variant: { type: String, default: undefined },
    rootClass: { type: [String, Object, Array], default: '' },
  },
  computed: {
    normalized() {
      return Array.isArray(this.items) ? this.items : []
    },
  },
  methods: {
    keyFor(t, idx) {
      if (t && typeof t === 'object') return t[this.itemValue] || t.id || idx
      return `${String(t)}-${idx}`
    },
    titleOf(t) {
      if (t && typeof t === 'object') return t[this.itemTitle] || t.name || t.Name || t.title || ''
      return String(t || '')
    },
  },
}
</script>

<style scoped>
.tag-chips { display: flex; flex-wrap: wrap; }
</style>

