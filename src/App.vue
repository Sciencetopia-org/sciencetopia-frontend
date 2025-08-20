<template>
  <v-app id="app" :style="{ '--footer-vh': smAndDown ? '8vh' : '6vh' }">
    <component :is="layout">
      <router-view />
    </component>
  </v-app>
</template>

<script>
import LayOut from './components/LayOut.vue'
import SimplestLayOut from './components/SimplestLayOut.vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'quill/dist/quill.snow.css' // for snow theme

export default {
  name: 'App',
  components: {
    LayOut,
    SimplestLayOut,
  },
  computed: {
    layout() {
      // Determine the layout based on the route meta
      const layout = this.$route.meta.layout
      if (layout === 'simplest') return 'SimplestLayOut' // Render directly without layout
      return 'LayOut' // Default layout for all other cases
    },
    smAndDown() {
      return this.$vuetify.display.smAndDown
    },
  },
}
</script>

<style scoped>
#app {
  font-family: Chinese-font, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  /* background-color: #e8dabd; */
  /* background-image: url('https://www.transparenttextures.com/patterns/cream-dust.png'); */
  overflow: visible;
}

@font-face {
  font-family: 'Chinese-font';
  src: url('./assets/fonts/SiYuanHeiTiGoogleBan/NotoSansCJK-Regular-1.otf') format('opentype');
}
</style>
