<template>
  <div v-if="visible" :style="styleObject" class="context-menu" @click.stop>
    <ul class="menu-list">
      <li @click="createNode">{{ $t('knowledgeGraph.createnode') }}</li>
      <li
        v-if="this.$store.state.selectedNodes.length === 2"
        @click="createLink"
      >
        {{ $t('knowledgeGraph.createlink') }}
      </li>
      <!-- Add more menu items here as needed -->
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    visible: Boolean,
    position: Object,
  },
  computed: {
    styleObject() {
      return {
        top: this.position.y + 'px',
        left: this.position.x + 'px',
      }
    },
  },
  mounted() {
    // Correctly use the mounted lifecycle hook
    document.addEventListener('click', this.handleClickOutside)
  },
  unmounted() {
    // Correct lifecycle hook name is 'unmounted' in Vue 3
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    createNode() {
      this.$store.dispatch('toggleNodeCreationForm', true) // Or true, depending on the context
      this.$emit('update:visible', false)
      // console.log('createNode');
    },
    createLink() {
      this.$store.dispatch('toggleLinkCreationForm', true) // Or true, depending on the context
      this.$emit('update:visible', false)
    },
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.$emit('update:visible', false)
      }
    },
  },
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 1000;
  background-color: #fff;
  border: 1px solid #ccc;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  padding: 10px 0;
}

.menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.menu-list li {
  padding: 8px 20px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.menu-list li:hover {
  background-color: #f5f5f5;
}
</style>
