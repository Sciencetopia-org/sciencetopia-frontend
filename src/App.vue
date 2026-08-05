<template>
  <v-app id="app" :class="pageBackground" :style="{ '--footer-vh': isPhone ? '8vh' : '6vh' }">
    <component :is="layout">
      <router-view />
    </component>
  </v-app>
</template>

<script>
import LayOut from './components/layout/LayOut.vue'
import SimplestLayOut from './components/layout/SimplestLayOut.vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'quill/dist/quill.snow.css' // for snow theme
import { installPhoneDeviceListeners, isPhoneDevice, phoneDeviceRevision } from '@/utils/device'

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
    isPhone() {
      phoneDeviceRevision.value
      return isPhoneDevice()
    },
    pageBackground() {
      const background = this.$route.meta.background
      if (background === 'lighter') return 'background-lighter'
      return 'background-darker'
    }
  },
  mounted() {
    installPhoneDeviceListeners()
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

.background-lighter {
  background-color: #FBF8F2; /* 你定义的浅色背景 */
}

.background-darker {
  background-color: #E7DAC1; /* 深色背景 */
}

@font-face {
  font-family: 'Chinese-font';
  src: url('./assets/fonts/SiYuanHeiTiGoogleBan/NotoSansCJK-Regular-1.otf') format('opentype');
  font-display: swap;
}
</style>
