<template>
  <div class="simplest-layout">
    <v-btn variant="plain" class="btn back-to-home" @click="backToHomePage">
      <img src="../../assets/images/logo.png" alt="Logo" class="logo-image" />
    </v-btn>

    <v-spacer class="header-spacer"></v-spacer>

    <main class="main-content">
      <slot></slot>
    </main>

    <DefaultFooterBar class="footer" />
  </div>
</template>

<script>
import DefaultFooterBar from './DefaultFooterBar.vue'

export default {
  name: 'SimplestLayOut',
  components: {
    DefaultFooterBar,
  },
  data() {
    return {}
  },
  methods: {
    backToHomePage() {
      this.$router.push({ name: 'HomePage' })
    },
  },
}
</script>

<style scoped>
.simplest-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: var(--content-padding, 16px);
}

.back-to-home {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  margin: 8px;
}

.logo-image {
  max-height: 120px;
  width: auto;
  transition: max-height 0.3s ease;
}

.header-spacer {
  height: 7vh;
}

.footer {
  margin-top: auto;
}

@media (max-width: 600px) {
  .main-content {
    --content-padding: 8px;
  }

  .logo-image {
    max-height: 80px;
  }

  .header-spacer {
    height: 5vh;
  }

  .back-to-home {
    margin: 4px;
  }
}

@media (min-width: 601px) and (max-width: 960px) {
  .main-content {
    --content-padding: 16px;
  }

  .logo-image {
    max-height: 100px;
  }
}

@media (min-width: 961px) {
  .main-content {
    --content-padding: 24px;
    max-width: 1280px;
    margin: 0 auto;
  }
}
</style>
