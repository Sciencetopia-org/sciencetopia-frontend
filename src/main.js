/* Set up using Vue 3 */
import { createApp } from 'vue'
import store from './store/store'
import App from './App.vue'
import i18n from './i18n'
import GlobalLoader from './components/GlobalLoader.vue'
import {
  initializeSignalRConnection,
  connection,
} from './services/signalr-service'
import router from './router'
import './assets/css/site.css'
import './styles/main.scss'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  icons: {
    iconfont: 'mdi',
  },
  components,
  directives,
  display: {
    // 添加响应式断点
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1264,
      xl: 1904,
    },
    // 添加响应式布局
    breakpoint: {
      mobileBreakpoint: 'sm',
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#000',
          text: '#304E75',
          // background: '#E8DABD',
          secondary: '#EC0017',
          yellow: '#E2B43C',
          accent: '#00FFF7',
          darkred: '#C8001D',
          error: '#f44336',
          border: '#C59F59',
        },
      },
      dark: {
        colors: {
          primary: '#ffffff',
          secondary: '#b0bec5',
          accent: '#8c9eff',
          error: '#f44336',
        },
      },
    },
  },
})

router.beforeEach((to, from, next) => {
  if (to.path !== from.path) {
    store.commit('resetSelectedNodes')
    store.commit('RESET_EDIT_MODE')
  }
  next()
})

const app = createApp(App)
app.component('GlobalLoader', GlobalLoader)

initializeSignalRConnection()
app.config.globalProperties.$signalRConnection = connection

app.use(router)
app.use(store)
app.use(vuetify)
app.use(i18n)

app.mount('#app')
