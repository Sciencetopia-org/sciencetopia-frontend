/* Set up using Vue 3 */
import { createApp } from 'vue'
import store from './store/store'
import App from './App.vue'
import i18n from './i18n'
import GlobalLoader from './components/ui/GlobalLoader.vue'
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
// Load shared panel styles after Vuetify to win specificity
import './assets/css/panels.css'

// Map vue-i18n locale to Vuetify's built-in locale keys
// Vuetify expects locales like 'en' and 'zhHans'
let initialI18nLocale = 'zh'
try {
  initialI18nLocale = (i18n.global?.locale?.value) || i18n.global?.locale || 'zh'
} catch (_) {}

// Lazily import Vuetify locale messages to avoid bundling issues
// Note: keep imports below createApp to ensure tree-shaking works well
// eslint-disable-next-line import/no-extraneous-dependencies
import { en, zhHans } from 'vuetify/locale'

const initialVuetifyLocale = initialI18nLocale === 'zh' ? 'zhHans' : 'en'

const vuetify = createVuetify({
  locale: {
    locale: initialVuetifyLocale,
    messages: { en, zhHans },
  },
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
          text: '#000',
          // background: '#E8DABD',
          secondary: '#EC0017',
          primary: '#304E75',
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

// Bridge for Options API code that accesses `this.$i18n`
app.config.globalProperties.$i18n = i18n.global

// If you later change i18n locale at runtime, also update Vuetify:
// e.g., i18n.global.locale = 'en'; vuetify.locale.current = 'en'

app.config.errorHandler = (err) => {
  const div = document.createElement('div')
  div.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:12px;font-size:14px;z-index:99999;word-break:break-all;white-space:pre-wrap;max-height:50vh;overflow:auto;'
  div.textContent = '[Vue Error] ' + (err?.stack || err?.message || String(err))
  document.body.appendChild(div)
}

window.addEventListener('error', (e) => {
  const div = document.createElement('div')
  div.style.cssText = 'position:fixed;top:0;left:0;right:0;background:darkred;color:white;padding:12px;font-size:14px;z-index:99999;word-break:break-all;white-space:pre-wrap;max-height:50vh;overflow:auto;'
  div.textContent = '[JS Error] ' + (e?.error?.stack || e?.message || String(e))
  document.body.appendChild(div)
})

window.addEventListener('unhandledrejection', (e) => {
  const div = document.createElement('div')
  div.style.cssText = 'position:fixed;top:0;left:0;right:0;background:maroon;color:white;padding:12px;font-size:14px;z-index:99999;word-break:break-all;white-space:pre-wrap;max-height:50vh;overflow:auto;'
  div.textContent = '[Promise Error] ' + (e?.reason?.stack || e?.reason?.message || String(e?.reason))
  document.body.appendChild(div)
})

app.mount('#app')

