<template>
  <div class="knowledgegraph-container">
    <!-- 知识网络 -->
    <KnowledgeNetwork>
      <!-- Slot content for full-screen overlay -->
      <div class="fullscreen-overlay-content">
        <NodeCreationForm v-if="this.$store.state.displayNodeCreationForm"></NodeCreationForm>
        <LinkCreationForm v-else-if="this.$store.state.displayLinkCreationForm"></LinkCreationForm>
        <NodeInfo v-else></NodeInfo>
      </div>
    </KnowledgeNetwork>

    <div class="non-fullscreen-content">
      <NodeCreationForm v-if="this.$store.state.displayNodeCreationForm"></NodeCreationForm>
      <LinkCreationForm v-else-if="this.$store.state.displayLinkCreationForm"></LinkCreationForm>
      <NodeInfo v-else></NodeInfo>
    </div>
  </div>
</template>

<script>
import KnowledgeNetwork from '@/components/KnowledgeNetwork.vue'
import NodeInfo from '@/components/NodeInfo.vue'
import NodeCreationForm from '@/components/NodeCreationForm.vue'
import LinkCreationForm from '@/components/LinkCreationForm.vue'
import { eventBus } from '@/eventBus'

export default {
  name: 'HomePage',
  components: {
    KnowledgeNetwork,
    NodeInfo,
    NodeCreationForm,
    LinkCreationForm,
  },
  created() {
    eventBus.on('show-feed-section', this.showFeed)
  },
  beforeUnmount() {
    eventBus.off('show-feed-section', this.showFeed)
  },
  methods: {
    showFeed() {
      this.$router.push({ name: 'allFeeds' })
    }
  }
}
</script>


<style scoped>
@import '../assets/css/special-text.css';
@import '../assets/css/knowledge-graph.css';

/* 设置主容器高度为视口高度，禁止滚动 */
.knowledgegraph-container {
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.fullscreen-overlay-content {
  position: fixed;
  top: 6vh;
  /* Offset from the top */
  right: 2vw;
  /* Offset from the right */
  width: 20vw;
  /* Fixed width */
  height: auto;
  /* Allows content to adjust based on its own size */
  max-height: 40vh;
  /* Restrict height if needed */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  /* Align items to the right */
  justify-content: flex-start;
  /* Align items to the top */
  z-index: 100000;
  /* Ensures it's always on top */
  pointer-events: auto;
  /* Allows interactions */
}

.non-fullscreen-content {
  position: absolute;
  top: 24vh;
  /* Offset from the top */
  right: 20px;
  /* Offset from the right */
  width: 20vw;
  /* Fixed width */
  height: auto;
  /* Allows content to adjust based on its own size */
  max-height: 40vh;
  /* Restrict height if needed */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  /* Align items to the right */
  justify-content: flex-start;
  /* Align items to the top */
  z-index: 10;
  /* Ensures it's always on top */
  pointer-events: auto;
  /* Allows interactions */
}
</style>
